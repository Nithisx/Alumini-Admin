/**
 * NotificationProvider — the UI half of notifications.
 *
 * All data, network and Web Push registration live in NotificationStore; this
 * component only:
 *  1. kicks off silent push registration + the poll on mount,
 *  2. renders the in-app toast for a foreground push,
 *  3. re-exposes the store through the existing useNotifications() context so
 *     the ~dozen consumers (bells, headers, settings) keep their current API.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { autorun } from 'mobx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { onForegroundMessage, clearOSNotifications } from '../../lib/webpush.js';
import { getRole } from '../../lib/authToken.js';
import { useNotificationStore } from '../../stores';

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
  const store = useNotificationStore();
  const navigate = useNavigate();
  const authToken = getRole();

  // Consumers are plain components, so the observable state is bridged into
  // React state — merely reading an observable does not subscribe a component.
  const [snapshot, setSnapshot] = useState(() => ({
    notifications: store.notifications.slice(),
    unreadCount: store.unreadCount,
    notificationStatus: store.status,
  }));

  useEffect(() => autorun(() => {
    setSnapshot({
      notifications: store.notifications.slice(),
      unreadCount: store.unreadCount,
      notificationStatus: store.status,
    });
  }), [store]);

  // ── Silent push registration + foreground listener ────────────────────────
  useEffect(() => {
    if (!authToken) return;

    // Dismiss any OS-level notifications sitting in the notification center.
    clearOSNotifications();

    // Register the existing grant without prompting — safe on page load.
    store.registerExisting();

    const showToastNotification = (data) => {
      const title = data.title || 'New Notification';
      const body  = data.body  || '';
      const type  = data.type  || 'general';

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

      store.fetch();
    };

    const unsubscribe = onForegroundMessage((payload) => {
      showToastNotification(payload.data || {});
    });

    // The React Native WebView shell forwards pushes as window messages.
    const handleNativeMessage = (event) => {
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload?.type === 'PUSH_NOTIFICATION') {
          showToastNotification(payload.data || {});
        }
      } catch {
        // Not a JSON message, or not for us.
      }
    };
    window.addEventListener('message', handleNativeMessage);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('message', handleNativeMessage);
    };
  }, [authToken, store, navigate]);

  // ── Initial fetch + polling ───────────────────────────────────────────────
  useEffect(() => {
    if (!authToken) return;
    store.fetch();
    const timer = setInterval(() => store.fetch(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [authToken, store]);

  return (
    <NotificationContext.Provider
      value={{
        ...snapshot,
        fetchNotifications: () => store.fetch(),
        markRead: (id) => store.markRead(id),
        markAllRead: () => store.markAllRead(),
        deleteNotification: (id) => store.deleteNotification(id),
        clearAllNotifications: () => store.clearAll(),
        requestPermission: () => store.requestPermission(),
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
