/**
 * NotificationProvider — React context that:
 *  1. Silently registers FCM token if permission is already granted (on mount)
 *  2. Exposes requestPermission() for UI-triggered permission prompts
 *  3. Listens for foreground FCM messages and shows an in-app toast
 *  4. Fetches the unread notification count from the backend periodically
 *  5. Exposes { notifications, unreadCount, fetchNotifications, markRead, markAllRead,
 *               notificationStatus, requestPermission }
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  registerExistingPermission,
  requestNotificationPermission,
  getNotificationStatus,
  onForegroundMessage,
  clearOSNotifications,
} from '../../lib/webpush.js';
import {
  API_NOTIFICATIONS,
  API_NOTIFICATION_READ,
  API_NOTIFICATION_READ_ALL,
  API_NOTIFICATION_DELETE,
  API_NOTIFICATION_CLEAR_ALL,
} from '../../config/api.js';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30_000; // poll every 30 s

// Notification type → icon map (for toast display)
const TYPE_ICONS = {
  event:                '📅',
  job:                  '💼',
  news:                 '📰',
  business:             '🏢',
  birthday:             '🎂',
  comment:              '💬',
  chat:                 '💬',
  registration_request: '👤',
  general:              '🔔',
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications]     = useState([]);
  const [unreadCount,   setUnreadCount]        = useState(0);
  const [loading,       setLoading]            = useState(false);
  const [notifStatus,   setNotifStatus]        = useState(() => getNotificationStatus());
  const pollingRef = useRef(null);
  const navigate   = useNavigate();

  const authToken = localStorage.getItem('Token');

  // ── Refresh the notification status (e.g. after user grants permission) ────
  const refreshStatus = useCallback(() => {
    setNotifStatus(getNotificationStatus());
  }, []);

  // ── Fetch notifications from backend ──────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_NOTIFICATIONS}?limit=50`, {
        headers: { Authorization: `Token ${authToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results || []);
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (err) {
      // silent — don't spam console on poll failure
    }
  }, [authToken]);

  // ── Mark single notification as read ──────────────────────────────────────
  const markRead = useCallback(async (id) => {
    if (!authToken) return;
    try {
      await fetch(API_NOTIFICATION_READ(id), {
        method: 'POST',
        headers: { Authorization: `Token ${authToken}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('[Notifications] Failed to mark read:', err);
    }
  }, [authToken]);

  // ── Mark all notifications as read ────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!authToken) return;
    try {
      await fetch(API_NOTIFICATION_READ_ALL, {
        method: 'POST',
        headers: { Authorization: `Token ${authToken}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[Notifications] Failed to mark all read:', err);
    }
  }, [authToken]);

  // ── Delete a single notification ──────────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    if (!authToken) return;
    try {
      await fetch(API_NOTIFICATION_DELETE(id), {
        method: 'DELETE',
        headers: { Authorization: `Token ${authToken}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => {
        const notif = notifications.find((n) => n.id === id);
        return notif && !notif.is_read ? Math.max(0, c - 1) : c;
      });
    } catch (err) {
      console.error('[Notifications] Failed to delete notification:', err);
    }
  }, [authToken, notifications]);

  // ── Clear all notifications ───────────────────────────────────────────────
  const clearAllNotifications = useCallback(async () => {
    if (!authToken) return;
    try {
      await fetch(API_NOTIFICATION_CLEAR_ALL, {
        method: 'DELETE',
        headers: { Authorization: `Token ${authToken}` },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('[Notifications] Failed to clear all notifications:', err);
    }
  }, [authToken]);

  // ── Request permission (must be triggered by user interaction) ────────────
  const requestPermission = useCallback(async () => {
    if (!authToken) return { success: false, reason: 'no_auth' };
    const result = await requestNotificationPermission(authToken);
    refreshStatus();
    return result;
  }, [authToken, refreshStatus]);

  // ── Silent FCM registration + foreground listener (on mount) ──────────────
  useEffect(() => {
    if (!authToken) return;

    // Dismiss any OS-level notifications from the browser notification center
    clearOSNotifications();

    // Silently register token if permission is already granted
    // (no prompt — safe to call on page load)
    registerExistingPermission(authToken)
      .then(() => refreshStatus())
      .catch(() => {});

    // Listen for messages arriving while the tab is active
    const unsubscribe = onForegroundMessage((payload) => {
      const data  = payload.data || {};
      const title = data.title || 'New Notification';
      const body  = data.body  || '';
      const type  = data.type  || 'general';

      // Show a styled toast
      toast.info(
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22 }}>{TYPE_ICONS[type] || '🔔'}</span>
          <div>
            <strong style={{ display: 'block', marginBottom: 2 }}>{title}</strong>
            <span style={{ fontSize: 13, opacity: 0.85 }}>{body}</span>
          </div>
        </div>,
        {
          position: 'top-right',
          autoClose: 5000,
          onClick: () => {
            if (data.click_url) {
              if (data.click_url.startsWith('/')) {
                navigate(data.click_url);
              } else {
                window.open(data.click_url, '_blank', 'noopener,noreferrer');
              }
            }
          },
        }
      );

      // Refresh notification list to show the new one
      fetchNotifications();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [authToken, fetchNotifications, refreshStatus]);

  // ── Initial fetch + polling ───────────────────────────────────────────────
  useEffect(() => {
    if (!authToken) return;
    fetchNotifications();

    pollingRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(pollingRef.current);
  }, [authToken, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markRead,
        markAllRead,
        deleteNotification,
        clearAllNotifications,
        notificationStatus: notifStatus,
        requestPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Inert fallback so headers (which embed NotificationBell) can render on
// standalone public pages — About, Privacy, Terms, Contact — that are not
// wrapped in <NotificationProvider>. Without this the bell's useNotifications()
// would throw and blank the page for logged-in users.
const noop = () => {};
const NO_PROVIDER_FALLBACK = Object.freeze({
  notifications: [],
  unreadCount: 0,
  loading: false,
  fetchNotifications: noop,
  markRead: noop,
  markAllRead: noop,
  deleteNotification: noop,
  clearAllNotifications: noop,
  notificationStatus: { permission: 'default', supported: false },
  requestPermission: () => Promise.resolve({ permission: 'default' }),
});

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    if (import.meta.env?.DEV) {
      console.warn(
        'useNotifications() used outside <NotificationProvider>; using inert fallback.'
      );
    }
    return NO_PROVIDER_FALLBACK;
  }
  return ctx;
}
