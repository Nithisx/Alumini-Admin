/**
 * RootStore — instantiates every domain store once and wires cross-store
 * access. Each store receives `this` (the root) so it can reach siblings
 * (e.g. AuthStore seeding PermissionStore, or clearing NotificationStore on
 * logout) without global singletons.
 *
 * Add a new domain store here and it's immediately available app-wide via
 * `useStores()` / the per-store hooks in StoreContext.
 */
import ConfigStore from "./ConfigStore";
import AuthStore from "./AuthStore";
import PermissionStore from "./PermissionStore";
import NotificationStore from "./NotificationStore";
import AuditStore from "./AuditStore";
import SignupRequestStore from "./SignupRequestStore";

export default class RootStore {
  constructor() {
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
