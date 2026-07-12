/**
 * RoleEditor — reassign a single user's role from their member detail page.
 *
 * Backed by GET /rbac/roles/ (role list, for the dropdown) and
 * PATCH /rbac/users/<uuid>/role/ (the actual change — backend requires both
 * rbac.manage and users.change_role, logs a RoleConversionLog row, and bumps
 * the RBAC cache so the affected user's new permissions apply immediately).
 */
import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRbacStore } from "../../../stores";
import { toast } from "react-toastify";
import { UserCog, Save, Loader2 } from "lucide-react";

const RoleEditor = observer(({ userId, currentRole, onRoleChanged }) => {
  const rbac = useRbacStore();
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(currentRole || "");
  const [savedRole, setSavedRole] = useState(currentRole || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await rbac.load();
        if (!cancelled) setRoles(list);
      } catch {
        if (!cancelled) toast.error("Failed to load roles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rbac]);

  useEffect(() => {
    setSelected(currentRole || "");
    setSavedRole(currentRole || "");
  }, [currentRole]);

  const dirty = useMemo(() => selected !== savedRole, [selected, savedRole]);

  const save = async () => {
    if (!userId || !selected || !dirty) return;
    setSaving(true);
    try {
      const data = await rbac.changeUserRole(userId, selected);
      const newRole = data?.new_role || selected;
      setSavedRole(newRole);
      setSelected(newRole);
      toast.success(`Role updated to ${newRole}.`);
      onRoleChanged?.(newRole);
    } catch (err) {
      toast.error(err.message || "Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 mb-6 bg-white">
      <div className="flex items-center gap-3 mb-4">
        <UserCog className="w-6 h-6 text-emerald-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">Role</h2>
          <p className="text-sm text-slate-500">
            Reassigning a role changes this user's permissions immediately.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={loading || saving}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white min-w-[180px]"
        >
          {!savedRole && <option value="">Select role…</option>}
          {roles.map((r) => (
            <option key={r.name} value={r.name}>
              {r.display_name || r.name}
            </option>
          ))}
        </select>

        <button
          onClick={save}
          disabled={!dirty || saving || loading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition ${
            dirty && !saving ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
    </div>
  );
});

export default RoleEditor;
