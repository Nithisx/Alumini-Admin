/**
 * NotificationBell — header notification icon with dropdown panel.
 *
 * Shows an animated bell icon with an unread badge count.
 * Clicking opens a glassmorphism dropdown with scrollable notification list,
 * per-notification read-on-click, and a "Mark all read" button.
 *
 * If push notifications aren't enabled yet, shows a prompt to enable them.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from './NotificationProvider.jsx';

// ── Type metadata ─────────────────────────────────────────────────────────────
const TYPE_META = {
  event:                { icon: '📅', label: 'Event',           color: '#7c3aed', bg: '#ede9fe' },
  job:                  { icon: '💼', label: 'Job',             color: '#0369a1', bg: '#e0f2fe' },
  news:                 { icon: '📰', label: 'News',            color: '#b45309', bg: '#fef3c7' },
  business:             { icon: '🏢', label: 'Business',        color: '#047857', bg: '#d1fae5' },
  birthday:             { icon: '🎂', label: 'Birthday',        color: '#be185d', bg: '#fce7f3' },
  comment:              { icon: '💬', label: 'Comment',         color: '#0891b2', bg: '#cffafe' },
  chat:                 { icon: '💬', label: 'Chat',            color: '#0891b2', bg: '#cffafe' },
  registration_request: { icon: '👤', label: 'Registration',   color: '#d97706', bg: '#fef3c7' },
  general:              { icon: '🔔', label: 'Alert',           color: '#4f46e5', bg: '#e0e7ff' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Enable Notifications Banner ───────────────────────────────────────────────
function EnableNotificationsBanner({ status, onEnable }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  const handleEnable = async () => {
    setLoading(true);
    const res = await onEnable();
    setResult(res);
    setLoading(false);
  };

  // Already granted — don't show
  if (status.permission === 'granted') return null;

  // iOS not installed as PWA
  if (status.isIOS && !status.isPWA) {
    return (
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
        borderBottom: '1px solid rgba(217,119,6,0.15)',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 22 }}>📲</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 3 }}>
            Enable Push Notifications
          </div>
          <div style={{ fontSize: 12, color: '#a16207', lineHeight: 1.4 }}>
            To receive notifications on your iPhone/iPad, tap
            <strong> Share </strong> → <strong> Add to Home Screen</strong>.
            Then open the app from your home screen.
          </div>
        </div>
      </div>
    );
  }

  // Permission denied — tell user to change in settings
  if (status.permission === 'denied') {
    return (
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
        borderBottom: '1px solid rgba(239,68,68,0.15)',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 22 }}>🚫</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#991b1b', marginBottom: 3 }}>
            Notifications Blocked
          </div>
          <div style={{ fontSize: 12, color: '#b91c1c', lineHeight: 1.4 }}>
            Notifications are blocked by your browser. Please update your browser or device settings to allow them.
          </div>
        </div>
      </div>
    );
  }

  // Browser doesn't support notifications
  if (!status.supported) {
    return (
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 22 }}>⚠️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 3 }}>
            Not Supported
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
            Your browser does not support push notifications.
          </div>
        </div>
      </div>
    );
  }

  // Show error result
  if (result && !result.success) {
    const messages = {
      dismissed: 'You dismissed the notification prompt. Click below to try again.',
      token_failed: 'Could not generate a notification token. Please try again.',
      error: result.message || 'Something went wrong. Please try again.',
    };
    return (
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
        borderBottom: '1px solid rgba(217,119,6,0.15)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div style={{ fontSize: 12, color: '#a16207', lineHeight: 1.4 }}>
            {messages[result.reason] || messages.error}
          </div>
        </div>
        <button
          onClick={handleEnable}
          disabled={loading}
          style={{
            background: '#059669', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Enabling…' : 'Try Again'}
        </button>
      </div>
    );
  }

  // Default: permission is 'default' — show enable button
  return (
    <div style={{
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
      borderBottom: '1px solid rgba(5,150,105,0.12)',
      display: 'flex', gap: 10, alignItems: 'center',
    }}>
      <span style={{ fontSize: 22 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#065f46', marginBottom: 2 }}>
          Stay Updated
        </div>
        <div style={{ fontSize: 12, color: '#047857', lineHeight: 1.3 }}>
          Enable push notifications to never miss important updates.
        </div>
      </div>
      <button
        id="enable-notifications-btn"
        onClick={handleEnable}
        disabled={loading}
        style={{
          background: '#059669', color: '#fff', border: 'none', borderRadius: 8,
          padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0,
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 0.15s, transform 0.1s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {loading ? 'Enabling…' : 'Enable'}
      </button>
    </div>
  );
}

export default function NotificationBell() {
  const {
    notifications, unreadCount, markRead, markAllRead,
    notificationStatus, requestPermission,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleItemClick = (notif) => {
    if (!notif.is_read) markRead(notif.id);
    const url = notif.data?.click_url;
    if (url) {
      // Use React Router for same-origin paths (SPA navigation, no full reload)
      if (url.startsWith('/')) {
        navigate(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* ── Bell Button ── */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 12,
          border: 'none',
          background: open ? '#f0fdf4' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.2s',
          padding: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Bell SVG */}
        <svg
          width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={open || unreadCount > 0 ? '#059669' : '#6b7280'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            animation: unreadCount > 0 ? 'notif-ring 2.5s ease-in-out infinite' : 'none',
            transformOrigin: 'top center',
          }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4, right: 4,
              minWidth: 18, height: 18,
              borderRadius: 9,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px #fff',
              animation: 'notif-badge-pop 0.3s ease',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          id="notification-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 360,
            maxWidth: '92vw',
            maxHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(5,150,105,0.15)',
            borderRadius: 18,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(5,150,105,0.1)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'notif-slide-in 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: '1px solid rgba(5,150,105,0.1)',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔔</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#065f46' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#059669', color: '#fff',
                  borderRadius: 10, fontSize: 11, fontWeight: 600,
                  padding: '2px 8px',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#059669', fontSize: 12, fontWeight: 600,
                  padding: '4px 8px', borderRadius: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#d1fae5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                Mark all read ✓
              </button>
            )}
          </div>

          {/* Enable Notifications Banner (shows only when permission isn't granted) */}
          <EnableNotificationsBanner
            status={notificationStatus}
            onEnable={requestPermission}
          />

          {/* Scrollable list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '48px 24px', gap: 12,
                color: '#9ca3af',
              }}>
                <span style={{ fontSize: 40 }}>🔕</span>
                <span style={{ fontSize: 14 }}>No notifications yet</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const meta = TYPE_META[notif.notification_type] || TYPE_META.general;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 16px',
                      border: 'none',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      background: notif.is_read
                        ? 'transparent'
                        : 'linear-gradient(90deg, rgba(5,150,105,0.05) 0%, transparent 100%)',
                      cursor: notif.data?.click_url ? 'pointer' : 'default',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.is_read
                        ? 'transparent'
                        : 'linear-gradient(90deg, rgba(5,150,105,0.05) 0%, transparent 100%)';
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: meta.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: notif.is_read ? 500 : 700,
                        fontSize: 13, color: '#111827',
                        marginBottom: 3,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {notif.title}
                      </div>
                      <div style={{
                        fontSize: 12, color: '#6b7280', lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {notif.body}
                      </div>
                      <div style={{
                        marginTop: 4, fontSize: 11, color: '#9ca3af',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{
                          background: meta.bg, color: meta.color,
                          borderRadius: 6, padding: '1px 6px', fontSize: 10, fontWeight: 600,
                        }}>
                          {meta.label}
                        </span>
                        <span>{timeAgo(notif.created_at)}</span>
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!notif.is_read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: 4,
                        background: '#059669', flexShrink: 0, marginTop: 4,
                      }} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid rgba(5,150,105,0.1)',
              textAlign: 'center',
              background: '#fafafa',
            }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                Showing last {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── CSS keyframes (injected once) ── */}
      <style>{`
        @keyframes notif-ring {
          0%, 100% { transform: rotate(0deg); }
          10%       { transform: rotate(14deg); }
          20%       { transform: rotate(-11deg); }
          30%       { transform: rotate(9deg); }
          40%       { transform: rotate(-7deg); }
          50%       { transform: rotate(4deg); }
          60%       { transform: rotate(0deg); }
        }
        @keyframes notif-badge-pop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes notif-slide-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        #notification-dropdown::-webkit-scrollbar { width: 6px; }
        #notification-dropdown::-webkit-scrollbar-track { background: transparent; }
        #notification-dropdown::-webkit-scrollbar-thumb {
          background: rgba(5,150,105,0.25); border-radius: 3px;
        }
      `}
      </style>
    </div>
  );
}
