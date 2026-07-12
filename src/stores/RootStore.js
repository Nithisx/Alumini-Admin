/**
 * RootStore — instantiates every domain store once and wires cross-store access.
 *
 * Each store lives in its own folder (stores/<domain>/index.js) and receives
 * `this` (the root), so a store can reach a sibling — e.g. AuthStore seeding
 * PermissionStore on login, or clearing NotificationStore on logout — without
 * global singletons or circular imports.
 *
 * Add a domain: create stores/<domain>/index.js, register it here, and expose a
 * hook in stores/index.js. It is then available app-wide.
 */
import ConfigStore from "./config";
import AuthStore from "./auth";
import PermissionStore from "./permissions";
import NotificationStore from "./notifications";
import AuditStore from "./audit";
import SignupRequestStore from "./signupRequests";

export default class RootStore {
  constructor() {
    // Order matters: stores that others depend on at construction come first.
    this.config = new ConfigStore(this);
    this.permissions = new PermissionStore(this);
    this.notifications = new NotificationStore(this);
    this.auth = new AuthStore(this);
    this.audit = new AuditStore(this);
    this.signupRequests = new SignupRequestStore(this);
  }
}

// Single app-wide instance.
export const rootStore = new RootStore();
