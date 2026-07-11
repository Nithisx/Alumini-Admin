/**
 * Roles & Permissions — the Admin panel for RBAC.
 *
 * Admin controls every page/action here: pick a role, toggle its permissions,
 * save. Backed by the RBAC endpoints (/rbac/permissions, /rbac/roles,
 * /rbac/roles/<name>/permissions). Emerald theme, matching the rest of the app.
 *
 * Per-user overrides (grant/revoke a single permission for one user) are
 * handled on the member detail screen; this page manages the role matrix.
 */
import React, { useEffect, useMemo, useState } from "react";
import axios from "../../../lib/axiosInstance";
import { API_RBAC_PERMISSIONS, API_RBAC_ROLES, API_RBAC_ROLE_PERMISSIONS } from "../../../config/api";
import { toast } from "react-toastify";
import { ShieldCheck, Save, Loader2 } from "lucide-react";

export default function RolesPermissionsPage() {
  const [groups, setGroups] = useState({});          // { group: [{codename, description}] }
  const [roles, setRoles] = useState([]);            // [{name, user_count, permissions:[...] }]
  const [activeRole, setActiveRole] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [permsRes, rolesRes] = await Promise.all([
          axios.get(API_RBAC_PERMISSIONS),
          axios.get(API_RBAC_ROLES),
        ]);
        const g = permsRes.data?.data?.groups || {};
        const r = rolesRes.data?.data?.roles || [];
        setGroups(g);
        setRoles(r);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-emerald-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading roles & permissions…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-7 h-7 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Roles &amp; Permissions</h1>
          <p className="text-sm text-slate-500">
            Control what each role can access. Changes take effect immediately.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Role list */}
        <aside className="space-y-1">
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => selectRole(role)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                activeRole === role.name
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400"
              }`}
            >
              <div className="font-semibold">{role.display_name || role.name}</div>
              <div className={`text-xs ${activeRole === role.name ? "text-emerald-50" : "text-slate-400"}`}>
                {role.user_count} user{role.user_count === 1 ? "" : "s"} · {role.permissions?.length || 0} perms
              </div>
            </button>
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
    </div>
  );
}
