/**
 * UserPermissionsPanel — per-user RBAC override editor.
 *
 * Mirrors RolesPermissionsPage.jsx's pattern (grouped checkbox grid, dirty
 * diff, toast feedback, emerald theme) but scoped to a single user's
 * grant/revoke overrides on top of their role's default permissions.
 * Backed by GET/PUT /rbac/users/<uuid>/permissions/.
 *
 * Three visual states per permission:
 *  - inherited from role: checked, muted, "via {role} role"
 *  - explicitly granted:  checked, emerald "+" badge
 *  - explicitly revoked:  unchecked (even though the role would grant it), red "−" badge
 *  - default (none of the above): unchecked, plain
 */
import React, { useEffect, useMemo, useState } from "react";
import axios from "../../../lib/axiosInstance";
import { API_BASE } from "../../../config/api";
import { toast } from "react-toastify";
import { UserCog, Save, Loader2 } from "lucide-react";

const EMPTY_BASELINE = { grants: [], revokes: [], effective: [] };

export default function UserPermissionsPanel({ userId, userRole }) {
  const [groups, setGroups] = useState({});          // { group: [{codename, description}] }
  const [role, setRole] = useState(userRole || null);
  const [baseline, setBaseline] = useState(EMPTY_BASELINE); // last-saved server state
  const [localGrants, setLocalGrants] = useState(new Set());
  const [localRevokes, setLocalRevokes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Permissions the role grants by default (present in `effective`, absent
  // from both `grants` and `revokes` in the last-saved baseline). This stays
  // fixed relative to the baseline — local edits never change what the ROLE
  // itself grants, only what's overridden on top of it.
  const roleInherited = useMemo(() => {
    const grantsSet = new Set(baseline.grants);
    const revokesSet = new Set(baseline.revokes);
    return new Set(
      (baseline.effective || []).filter((c) => !grantsSet.has(c) && !revokesSet.has(c))
    );
  }, [baseline]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [permsRes, userPermsRes] = await Promise.all([
          axios.get(`${API_BASE}/rbac/permissions/`),
          axios.get(`${API_BASE}/rbac/users/${userId}/permissions/`),
        ]);
        if (cancelled) return;
        const g = permsRes.data?.data?.groups || permsRes.data?.groups || {};
        const userPayload = userPermsRes.data?.data || userPermsRes.data || {};
        const grants = userPayload.grants || [];
        const revokes = userPayload.revokes || [];
        const effective = userPayload.effective || [];
        setGroups(g);
        setRole(userPayload.role || userRole || null);
        setBaseline({ grants, revokes, effective });
        setLocalGrants(new Set(grants));
        setLocalRevokes(new Set(revokes));
      } catch {
        if (!cancelled) toast.error("Failed to load user permissions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, userRole]);

  const toggle = (codename) => {
    const isRoleInherited = roleInherited.has(codename);
    const isGranted = localGrants.has(codename);
    const isRevoked = localRevokes.has(codename);
    const isChecked = isGranted || (isRoleInherited && !isRevoked);

    if (isChecked) {
      // Unchecking.
      if (isRoleInherited) {
        // Role would grant this — explicitly override it off.
        setLocalRevokes((prev) => new Set(prev).add(codename));
        if (isGranted) {
          setLocalGrants((prev) => {
            const next = new Set(prev);
            next.delete(codename);
            return next;
          });
        }
      } else if (isGranted) {
        // Was an explicit grant — remove it, back to default (not granted).
        setLocalGrants((prev) => {
          const next = new Set(prev);
          next.delete(codename);
          return next;
        });
      }
    } else {
      // Checking.
      if (isRevoked) {
        // Was an explicit revoke — remove it, back to role-inherited default.
        setLocalRevokes((prev) => {
          const next = new Set(prev);
          next.delete(codename);
          return next;
        });
      } else {
        // Not inherited, not revoked — explicitly grant it.
        setLocalGrants((prev) => new Set(prev).add(codename));
      }
    }
  };

  const dirty = useMemo(() => {
    const baseGrants = new Set(baseline.grants);
    const baseRevokes = new Set(baseline.revokes);
    if (baseGrants.size !== localGrants.size) return true;
    if (baseRevokes.size !== localRevokes.size) return true;
    for (const c of localGrants) if (!baseGrants.has(c)) return true;
    for (const c of localRevokes) if (!baseRevokes.has(c)) return true;
    return false;
  }, [baseline, localGrants, localRevokes]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${API_BASE}/rbac/users/${userId}/permissions/`,
        { grants: [...localGrants], revokes: [...localRevokes] }
      );
      const payload = data?.data || data || {};
      const effective = payload.effective || [];
      setBaseline({
        grants: [...localGrants],
        revokes: [...localRevokes],
        effective,
      });
      toast.success("User permissions updated.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save user permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-emerald-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading permissions…
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <UserCog className="w-6 h-6 text-emerald-600" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Permission overrides
            {role && <span className="ml-2 text-sm font-normal text-slate-400">via {role} role</span>}
          </h2>
          <p className="text-sm text-slate-500">
            Grant or revoke specific permissions for this user, on top of their role's defaults.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" /> Inherited from role
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center justify-center">+</span> Explicitly granted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold inline-flex items-center justify-center">−</span> Explicitly revoked
          </span>
        </div>
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
              {perms.map((p) => {
                const isRoleInherited = roleInherited.has(p.codename);
                const isGranted = localGrants.has(p.codename);
                const isRevoked = localRevokes.has(p.codename);
                const isChecked = isGranted || (isRoleInherited && !isRevoked);
                const inheritedOnly = isRoleInherited && !isGranted && !isRevoked;

                return (
                  <label
                    key={p.codename}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-emerald-50/40"
                    title={inheritedOnly ? `Granted via ${role || "the"} role` : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(p.codename)}
                      className={`w-4 h-4 ${inheritedOnly ? "accent-slate-400" : "accent-emerald-600"}`}
                    />
                    <span className={`text-sm ${inheritedOnly ? "text-slate-500" : "text-slate-700"}`}>
                      {p.description || p.codename}
                    </span>
                    {inheritedOnly && (
                      <span className="text-[10px] text-slate-400 italic">via {role || "role"}</span>
                    )}
                    {isGranted && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center justify-center" title="Explicitly granted">
                        +
                      </span>
                    )}
                    {isRevoked && (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold inline-flex items-center justify-center" title="Explicitly revoked">
                        −
                      </span>
                    )}
                    <code className="ml-auto text-xs text-slate-400">{p.codename}</code>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
