/**
 * RbacStore — the admin Roles & Permissions panel.
 * Everything here needs rbac.manage (the backend enforces it).
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import {
  API_RBAC_PERMISSIONS,
  API_RBAC_ROLES,
  API_RBAC_ROLE_DETAIL,
  API_RBAC_ROLE_PERMISSIONS,
  API_RBAC_USER_ROLE,
  API_RBAC_USER_PERMISSIONS,
} from "../../config/api";

export default class RbacStore {
  groups = {};
  roles = [];
  loading = false;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  async load() {
    this.loading = true;
    try {
      const [perms, roles] = await Promise.all([
        api.get(API_RBAC_PERMISSIONS),
        api.get(API_RBAC_ROLES),
      ]);
      runInAction(() => {
        this.groups = perms?.groups || {};
        this.roles = roles?.roles || [];
      });
      return this.roles;
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  async setRolePermissions(roleName, permissions) {
    const data = await api.put(API_RBAC_ROLE_PERMISSIONS(roleName), { permissions });
    const applied = data?.permissions || permissions;
    runInAction(() => {
      this.roles = this.roles.map((r) => (r.name === roleName ? { ...r, permissions: applied } : r));
    });
    return applied;
  }

  async createRole(payload) {
    const role = await api.post(API_RBAC_ROLES, payload);
    runInAction(() => { this.roles = [...this.roles, role]; });
    return role;
  }

  async updateRole(roleName, payload) {
    const updated = await api.patch(API_RBAC_ROLE_DETAIL(roleName), payload);
    runInAction(() => {
      this.roles = this.roles.map((r) => (r.name === roleName ? { ...r, ...updated } : r));
    });
    return updated;
  }

  /**
   * Delete a role. If it still has members the backend answers 409 with
   * details.member_count — the caller must then re-call with `reassignTo`.
   */
  async deleteRole(roleName, reassignTo = null) {
    await api.delete(API_RBAC_ROLE_DETAIL(roleName), reassignTo ? { reassign_to: reassignTo } : undefined);
    runInAction(() => { this.roles = this.roles.filter((r) => r.name !== roleName); });
  }

  changeUserRole(userId, role) {
    return api.patch(API_RBAC_USER_ROLE(userId), { role });
  }

  getUserOverrides(userId) {
    return api.get(API_RBAC_USER_PERMISSIONS(userId));
  }

  setUserOverrides(userId, grants, revokes) {
    return api.put(API_RBAC_USER_PERMISSIONS(userId), { grants, revokes });
  }
}
