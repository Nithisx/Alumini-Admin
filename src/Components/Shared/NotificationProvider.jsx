/**
 * NotificationProvider — React context that:
 *  1. Requests FCM push notification permission on first load (after login)
 *  2. Listens for foreground FCM messages and shows an in-app toast
 *  3. Fetches the unread notification count from the backend periodically
 *  4. Exposes { notifications, unreadCount, fetchNotifications, markRead, markAllRead }
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { toast } from 'react-toastify';
import {
  requestNotificationPermission,
  onForegroundMessage,
} from '../../lib/firebase.js';
import {
  API_NOTIFICATIONS,
  API_NOTIFICATION_READ,
  API_NOTIFICATION_READ_ALL,
} from '../../config/api.js';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30_000; // poll every 30 s

// Notification type → icon map (for toast display)
const TYPE_ICONS = {
  event:    '📅',
  job:      '💼',
  news:     '📰',
  business: '🏢',
  birthday: '🎂',
  comment:  '💬',
  chat:     '💬',
  general:  '🔔',
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications]     = useState([]);
  const [unreadCount,   setUnreadCount]        = useState(0);
  const [loading,       setLoading]            = useState(false);
  const pollingRef = useRef(null);

  const authToken = localStorage.getItem('Token');

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

  // ── Register FCM token + listen for foreground messages ───────────────────
  useEffect(() => {
    if (!authToken) return;

    // Register FCM token (asks permission on first call)
    requestNotificationPermission(authToken).catch(() => {});

    // Listen for messages arriving while the tab is active
    const unsubscribe = onForegroundMessage((payload) => {
      const notification = payload.notification || {};
      const data         = payload.data         || {};
      const title = notification.title || data.title || 'New Notification';
      const body  = notification.body  || data.body  || '';
      const type  = data.type || 'general';

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
            if (data.click_url) window.location.href = data.click_url;
          },
        }
      );

      // Refresh notification list to show the new one
      fetchNotifications();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [authToken, fetchNotifications]);

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
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
