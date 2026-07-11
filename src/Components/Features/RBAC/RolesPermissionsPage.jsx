/**
 * Roles & Permissions — the Admin panel for RBAC.
 *
 * Admin controls every page/action here: pick a role, toggle its permissions,
 * save. Backed by the RBAC endpoints (/rbac/permissions, /rbac/roles,
 * /rbac/roles/<name>/, /rbac/roles/<name>/permissions). Emerald theme,
 * matching the rest of the app.
 *
 * Saving the permission matrix (PUT .../permissions/) only ever touches the
 * currently selected role — every other role's matrix is untouched.
 *
 * Roles can also be created, renamed, and deleted here. System (seeded)
 * roles — Admin/Manager/Moderator/Staff/Alumni/Student — cannot be deleted
 * or have their internal name changed (only display name/description).
 * Deleting a role that still has members requires picking a role to move
 * them to first; the backend enforces this (409 + member_count) and this
 * page prompts for the target role when that happens.
 *
 * Per-user overrides (grant/revoke a single permission for one user) are
 * handled on the member detail screen; this page manages the role matrix.
 */
import React, { useEffect, useMemo, useState } from "react";
import axios from "../../../lib/axiosInstance";
import {
  API_RBAC_PERMISSIONS,
  API_RBAC_ROLES,
  API_RBAC_ROLE_PERMISSIONS,
  API_RBAC_ROLE_DETAIL,
} from "../../../config/api";
import { toast } from "react-toastify";
import { ShieldCheck, Save, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import ConfirmModal from "../../Shared/ConfirmModal";
import FormModal from "../../Shared/FormModal";

export default function RolesPermissionsPage() {
  const [groups, setGroups] = useState({});          // { group: [{codename, description}] }
  const [roles, setRoles] = useState([]);            // [{name, user_count, permissions:[...] }]
  const [activeRole, setActiveRole] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create-role modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [creating, setCreating] = useState(false);

  // Rename/edit-metadata modal
  const [renameTarget, setRenameTarget] = useState(null); // role object
  const [renameDisplayName, setRenameDisplayName] = useState("");
  const [renameDescription, setRenameDescription] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Delete flow: plain confirm first, then (if the role has members) a
  // second modal asking which role to move them to.
  const [deleteTarget, setDeleteTarget] = useState(null); // role object
  const [reassignInfo, setReassignInfo] = useState(null); // { role, memberCount }
  const [reassignTo, setReassignTo] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadAll = async () => {
    const [permsRes, rolesRes] = await Promise.all([
      axios.get(API_RBAC_PERMISSIONS),
      axios.get(API_RBAC_ROLES),
    ]);
    const g = permsRes.data?.data?.groups || {};
    const r = rolesRes.data?.data?.roles || [];
    setGroups(g);
    setRoles(r);
    return r;
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await loadAll();
        if (r.length) {
          setActiveRole(r[0].name);
          setSelected(new Set(r[0].permissions || []));
        }
      } catch {
        toast.error("Failed to load roles & permissions.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectRole = (role) => {
    setActiveRole(role.name);
    setSelected(new Set(role.permissions || []));
  };

  const toggle = (codename) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(codename)) next.delete(codename);
      else next.add(codename);
      return next;
    });
  };

  const save = async () => {
    if (!activeRole) return;
    setSaving(true);
    try {
      const { data } = await axios.put(
        API_RBAC_ROLE_PERMISSIONS(activeRole),
        { permissions: [...selected] }
      );
      const applied = data?.data?.permissions || [...selected];
      setRoles((rs) => rs.map((r) => (r.name === activeRole ? { ...r, permissions: applied } : r)));
      toast.success(`Permissions updated for ${activeRole}.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  const dirty = useMemo(() => {
    const current = roles.find((r) => r.name === activeRole)?.permissions || [];
    if (current.length !== selected.size) return true;
    return current.some((c) => !selected.has(c));
  }, [roles, activeRole, selected]);

  /* ── create role ───────────────────────────────────────────────────── */
  const openCreate = () => {
    setNewName("");
    setNewDisplayName("");
    setShowCreate(true);
  };

  const createRole = async () => {
    if (!newName.trim()) {
      toast.error("Role name is required.");
      return;
    }
    setCreating(true);
    try {
      const { data } = await axios.post(API_RBAC_ROLES, {
        name: newName.trim(),
        display_name: newDisplayName.trim() || newName.trim(),
      });
      const role = data?.data;
      if (role) {
        setRoles((rs) => [...rs, role]);
        setActiveRole(role.name);
        setSelected(new Set(role.permissions || []));
      }
      toast.success(`Role "${newDisplayName || newName}" created.`);
      setShowCreate(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create role.");
    } finally {
      setCreating(false);
    }
  };

  /* ── rename / edit metadata ───────────────────────────────────────── */
  const openRename = (role, e) => {
    e.stopPropagation();
    setRenameTarget(role);
    setRenameDisplayName(role.display_name || role.name);
    setRenameDescription(role.description || "");
  };

  const saveRename = async () => {
    if (!renameTarget) return;
    setRenaming(true);
    try {
      const { data } = await axios.patch(API_RBAC_ROLE_DETAIL(renameTarget.name), {
        display_name: renameDisplayName.trim() || renameTarget.name,
        description: renameDescription,
      });
      const updated = data?.data;
      setRoles((rs) => rs.map((r) => (r.name === renameTarget.name ? { ...r, ...updated } : r)));
      toast.success("Role updated.");
      setRenameTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update role.");
    } finally {
      setRenaming(false);
    }
  };

  /* ── delete (with reassignment when the role still has members) ──── */
  const openDelete = (role, e) => {
    e.stopPropagation();
    setDeleteTarget(role);
  };

  const removeRoleFromState = (roleName) => {
    setRoles((rs) => {
      const next = rs.filter((r) => r.name !== roleName);
      if (activeRole === roleName) {
        setActiveRole(next.length ? next[0].name : null);
        setSelected(new Set(next.length ? next[0].permissions || [] : []));
      }
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(API_RBAC_ROLE_DETAIL(deleteTarget.name));
      toast.success(`Role "${deleteTarget.display_name || deleteTarget.name}" deleted.`);
      removeRoleFromState(deleteTarget.name);
      setDeleteTarget(null);
    } catch (err) {
      const memberCount = err?.response?.data?.details?.member_count;
      if (err?.response?.status === 409 && memberCount != null) {
        // Needs a reassignment target — swap to the second modal.
        setReassignInfo({ role: deleteTarget, memberCount });
        setReassignTo("");
        setDeleteTarget(null);
      } else {
        toast.error(err?.response?.data?.message || "Failed to delete role.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const confirmReassignAndDelete = async () => {
    if (!reassignInfo || !reassignTo) return;
    setDeleting(true);
    try {
      await axios.delete(API_RBAC_ROLE_DETAIL(reassignInfo.role.name), {
        data: { reassign_to: reassignTo },
      });
      toast.success(
        `Role "${reassignInfo.role.display_name || reassignInfo.role.name}" deleted — ${reassignInfo.memberCount} member(s) moved to ${reassignTo}.`
      );
      removeRoleFromState(reassignInfo.role.name);
      setReassignInfo(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete role.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-emerald-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading roles & permissions…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Roles &amp; Permissions</h1>
            <p className="text-sm text-slate-500">
              Control what each role can access. Changes take effect immediately.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium bg-emerald-600 hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> New role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Role list */}
        <aside className="space-y-1">
          {roles.map((role) => (
            <div
              key={role.name}
              onClick={() => selectRole(role)}
              className={`group w-full text-left px-4 py-3 rounded-lg border transition cursor-pointer flex items-start justify-between gap-2 ${
                activeRole === role.name
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400"
              }`}
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">{role.display_name || role.name}</div>
                <div className={`text-xs ${activeRole === role.name ? "text-emerald-50" : "text-slate-400"}`}>
                  {role.user_count} user{role.user_count === 1 ? "" : "s"} · {role.permissions?.length || 0} perms
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                <button
                  onClick={(e) => openRename(role, e)}
                  title="Rename role"
                  className={`p-1.5 rounded-md ${
                    activeRole === role.name ? "hover:bg-emerald-700 text-white" : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {!role.is_system && (
                  <button
                    onClick={(e) => openDelete(role, e)}
                    title="Delete role"
                    className={`p-1.5 rounded-md ${
                      activeRole === role.name ? "hover:bg-emerald-700 text-white" : "hover:bg-red-50 text-red-500"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </aside>

        {/* Permission matrix for the active role */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {activeRole} permissions
            </h2>
            <button
              onClick={save}
              disabled={!dirty || saving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition ${
                dirty && !saving ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
          </div>

          <div className="space-y-5">
            {Object.entries(groups).map(([group, perms]) => (
              <div key={group} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group}
                </div>
                <div className="divide-y divide-slate-100">
                  {perms.map((p) => (
                    <label
                      key={p.codename}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-emerald-50/40"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(p.codename)}
                        onChange={() => toggle(p.codename)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="text-sm text-slate-700">{p.description || p.codename}</span>
                      <code className="ml-auto text-xs text-slate-400">{p.codename}</code>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Create role */}
      <FormModal
        isOpen={showCreate}
        title="Create a new role"
        confirmText={creating ? "Creating…" : "Create role"}
        confirmDisabled={creating || !newName.trim()}
        onConfirm={createRole}
        onCancel={() => setShowCreate(false)}
      >
        <div className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Internal name (cannot be changed later)
            </label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Mentor"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Display name
            </label>
            <input
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="e.g. Mentor"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <p className="text-xs text-slate-400">
            The new role starts with no permissions — select it afterward to grant some.
          </p>
        </div>
      </FormModal>

      {/* Rename / edit metadata */}
      <FormModal
        isOpen={!!renameTarget}
        title={`Edit "${renameTarget?.name}"`}
        confirmText={renaming ? "Saving…" : "Save"}
        confirmDisabled={renaming}
        onConfirm={saveRename}
        onCancel={() => setRenameTarget(null)}
      >
        <div className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Display name
            </label>
            <input
              autoFocus
              value={renameDisplayName}
              onChange={(e) => setRenameDisplayName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={renameDescription}
              onChange={(e) => setRenameDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
      </FormModal>

      {/* Delete: plain confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete "${deleteTarget?.display_name || deleteTarget?.name}"?`}
        message="This cannot be undone. If any users still have this role, you'll be asked which role to move them to next."
        confirmText={deleting ? "Deleting…" : "Delete role"}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Delete: needs a reassignment target */}
      <FormModal
        isOpen={!!reassignInfo}
        title="Choose a role for the affected members"
        confirmText={deleting ? "Moving…" : "Move members & delete role"}
        confirmDisabled={deleting || !reassignTo}
        danger
        onConfirm={confirmReassignAndDelete}
        onCancel={() => setReassignInfo(null)}
      >
        <div className="space-y-3 text-left">
          <p className="text-sm text-slate-600">
            <strong>{reassignInfo?.memberCount}</strong> user{reassignInfo?.memberCount === 1 ? "" : "s"} currently
            {" "}have the <strong>{reassignInfo?.role?.display_name || reassignInfo?.role?.name}</strong> role.
            Pick a role to move them to before it's deleted.
          </p>
          <select
            value={reassignTo}
            onChange={(e) => setReassignTo(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">Select a role…</option>
            {roles
              .filter((r) => r.name !== reassignInfo?.role?.name)
              .map((r) => (
                <option key={r.name} value={r.name}>
                  {r.display_name || r.name}
                </option>
              ))}
          </select>
        </div>
      </FormModal>
    </div>
  );
}
