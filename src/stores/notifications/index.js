/**
 * NotificationStore — in-app notifications + Web Push lifecycle.
 *
 * Owns all the data + network + push-registration logic that used to live
 * inline in NotificationProvider. The provider component becomes a thin
 * observer that renders toasts and wires the foreground-message listener; all
 * fetching/marking/push registration goes through this store.
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import {
  API_NOTIFICATIONS,
  API_NOTIFICATION_READ,
  API_NOTIFICATION_READ_ALL,
  API_NOTIFICATION_DELETE,
  API_NOTIFICATION_CLEAR_ALL,
} from "../../config/api";
import { getRole } from "../../lib/authToken";
import {
  getNotificationStatus,
  requestNotificationPermission,
  registerExistingPermission,
  unregisterNotificationToken,
  getCachedEndpoint,
} from "../../lib/webpush";

export default class NotificationStore {
  notifications = [];
  unreadCount = 0;
  status = getNotificationStatus();

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  get isAuthed() {
    return Boolean(getRole());
  }

  refreshStatus() {
    this.status = getNotificationStatus();
  }

  async fetch() {
    if (!this.isAuthed) return;
    try {
      const data = await api.get(`${API_NOTIFICATIONS}?limit=50`, { raw: true });
      const list = Array.isArray(data) ? data : (data?.results || []);
      runInAction(() => {
        this.notifications = list;
        this.unreadCount = list.filter((n) => !n.is_read).length;
      });
    } catch { /* silent — poll failures shouldn't spam */ }
  }

  async markRead(id) {
    if (!this.isAuthed) return;
    try {
      await api.post(API_NOTIFICATION_READ(id));
      runInAction(() => {
        this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    } catch { /* non-fatal */ }
  }

  async markAllRead() {
    if (!this.isAuthed) return;
    try {
      await api.post(API_NOTIFICATION_READ_ALL);
      runInAction(() => {
        this.notifications = this.notifications.map((n) => ({ ...n, is_read: true }));
        this.unreadCount = 0;
      });
    } catch { /* non-fatal */ }
  }

  async deleteNotification(id) {
    if (!this.isAuthed) return;
    try {
      await api.delete(API_NOTIFICATION_DELETE(id));
      runInAction(() => {
        const notif = this.notifications.find((n) => n.id === id);
        this.notifications = this.notifications.filter((n) => n.id !== id);
        if (notif && !notif.is_read) this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    } catch { /* non-fatal */ }
  }

  async clearAll() {
    if (!this.isAuthed) return;
    try {
      await api.delete(API_NOTIFICATION_CLEAR_ALL);
      runInAction(() => { this.notifications = []; this.unreadCount = 0; });
    } catch { /* non-fatal */ }
  }

  // ── Web Push lifecycle (role string namespaces the device cache) ──────────
  async requestPermission() {
    if (!this.isAuthed) return { success: false, reason: "no_auth" };
    const result = await requestNotificationPermission(getRole());
    this.refreshStatus();
    return result;
  }

  registerExisting() {
    if (!this.isAuthed) return Promise.resolve(null);
    return registerExistingPermission(getRole()).then((r) => { this.refreshStatus(); return r; });
  }

  cachedPushEndpoint(role) {
    return getCachedEndpoint(role || getRole());
  }

  unregisterPush(role) {
    return unregisterNotificationToken(role || getRole()).catch(() => {});
  }
}
