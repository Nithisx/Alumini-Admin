/**
 * RootStore — instantiates every domain store once and wires cross-store access.
 *
 * One folder per domain (stores/<domain>/index.js). Each store receives `this`
 * (the root), so a store can reach a sibling — AuthStore seeding PermissionStore
 * on login, AuthStore clearing NotificationStore on logout — without global
 * singletons or circular imports.
 *
 * To add a domain: create stores/<domain>/index.js, register it below, and
 * export a hook from stores/index.js.
 */
import ConfigStore from "./config";
import AuthStore from "./auth";
import PermissionStore from "./permissions";
import NotificationStore from "./notifications";
import AuditStore from "./audit";
import SignupRequestStore from "./signupRequests";
import ProfileStore from "./profile";
import DashboardStore from "./dashboard";
import NewsStore from "./news";
import EventsStore from "./events";
import AlbumsStore from "./albums";
import BusinessStore from "./business";
import JobsStore from "./jobs";
import MembersStore from "./members";
import ChatStore from "./chat";
import MapStore from "./map";
import RbacStore from "./rbac";
import BirthdayStore from "./birthday";
import ContributionsStore from "./contributions";

export default class RootStore {
  constructor() {
    // Order matters only where a store is used during another's construction.
    this.config = new ConfigStore(this);
    this.permissions = new PermissionStore(this);
    this.notifications = new NotificationStore(this);
    this.auth = new AuthStore(this);

    this.profile = new ProfileStore(this);
    this.dashboard = new DashboardStore(this);

    // Content domains (all extend base/ContentStore)
    this.news = new NewsStore(this);
    this.events = new EventsStore(this);
    this.albums = new AlbumsStore(this);
    this.business = new BusinessStore(this);
    this.jobs = new JobsStore(this); // NB: the UI's "posts"/feed = the jobs domain

    this.members = new MembersStore(this);
    this.chat = new ChatStore(this);
    this.map = new MapStore(this);
    this.rbac = new RbacStore(this);
    this.birthday = new BirthdayStore(this);
    this.contributions = new ContributionsStore(this);

    this.audit = new AuditStore(this);
    this.signupRequests = new SignupRequestStore(this);
  }

  /** Wipe all user-scoped state on logout. */
  reset() {
    this.chat.dispose();
    this.permissions.clear();
    this.profile.clear();
    this.contributions.clear();
  }
}

// Single app-wide instance.
export const rootStore = new RootStore();
