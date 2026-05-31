/**
 * NotificationPromptModal — One-time modal shown to users on first visit
 * asking them to enable push notifications.
 *
 * Shows contextual error messages if the browser doesn't support notifications
 * or if something goes wrong during the permission request.
 *
 * Appears only once per browser session (tracked via sessionStorage).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './NotificationProvider.jsx';

const DISMISSED_KEY = 'notif_prompt_dismissed';

// ── Reason-specific guidance messages ─────────────────────────────────────────
const REASON_CARDS = {
  unsupported: {
    icon: '⚠️',
    title: 'Browser Not Supported',
    body: 'Your browser does not support push notifications. Try using Google Chrome, Microsoft Edge, or Firefox for the best experience.',
    color: '#92400e',
    bg: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
    border: 'rgba(217,119,6,0.2)',
  },
  ios_not_pwa: {
    icon: '📲',
    title: 'Add to Home Screen First',
    body: 'On iPhone / iPad, push notifications only work when this site is installed as an app. Tap the Share button (□↑) at the bottom of Safari, then tap "Add to Home Screen". Open the app from your home screen to enable notifications.',
    color: '#1e40af',
    bg: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
    border: 'rgba(59,130,246,0.2)',
  },
  denied: {
    icon: '🚫',
    title: 'Notifications Blocked',
    body: 'Notifications have been blocked by your browser. To fix this:\n\n• Chrome: Click the lock icon (🔒) in the address bar → Site Settings → Allow Notifications\n• Firefox: Click the lock icon → Connection Secure → More Information → Permissions\n• Safari: Preferences → Websites → Notifications → Allow',
    color: '#991b1b',
    bg: 'linear-gradient(135deg, #fef2f2, #fff1f2)',
    border: 'rgba(239,68,68,0.2)',
  },
  dismissed: {
    icon: '🔕',
    title: 'Permission Not Granted',
    body: 'You dismissed the notification prompt. You can try again by clicking the button below, or enable it later from the notification bell (🔔) in the header.',
    color: '#92400e',
    bg: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
    border: 'rgba(217,119,6,0.2)',
    retryable: true,
  },
  token_failed: {
    icon: '⚙️',
    title: 'Setup Failed',
    body: 'Permission was granted but we couldn\'t complete the setup. This can happen if your browser\'s privacy settings or an ad-blocker is restricting background services. Try disabling shields/ad-blockers and refreshing the page.',
    color: '#b45309',
    bg: 'linear-gradient(135deg, #fef3c7, #fffbeb)',
    border: 'rgba(217,119,6,0.2)',
    retryable: true,
  },
  error: {
    icon: '❌',
    title: 'Something Went Wrong',
    body: 'We couldn\'t set up push notifications. This usually happens if your browser\'s privacy settings or an ad-blocker is restricting background services. Check your settings and try again.',
    color: '#991b1b',
    bg: 'linear-gradient(135deg, #fef2f2, #fff1f2)',
    border: 'rgba(239,68,68,0.2)',
    retryable: true,
  },
};

export default function NotificationPromptModal() {
  const { notificationStatus, requestPermission } = useNotifications();
  const [visible, setVisible]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null); // null | { success, reason }
  const [closing, setClosing]   = useState(false);

  // Decide whether to show the modal on mount
  useEffect(() => {
    // Already granted, or user previously dismissed → don't show
    if (notificationStatus.permission === 'granted') return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // Small delay so the page renders first
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [notificationStatus.permission]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      sessionStorage.setItem(DISMISSED_KEY, 'true');
    }, 250);
  }, []);

  const handleEnable = useCallback(async () => {
    setLoading(true);
    setResult(null);
    const res = await requestPermission();
    setLoading(false);

    if (res.success) {
      // Success — close with a brief celebration
      setResult(res);
      setTimeout(handleClose, 1200);
    } else {
      setResult(res);
    }
  }, [requestPermission, handleClose]);

  const handleSkip = useCallback(() => {
    handleClose();
  }, [handleClose]);

  if (!visible) return null;

  const failCard = result && !result.success ? REASON_CARDS[result.reason] || REASON_CARDS.error : null;

  return (
    <>
      {/* ── Backdrop (glassmorphism/blur overlay) ── */}
      <div
        onClick={handleSkip}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99998,
          animation: closing ? 'npFadeOut 0.25s ease forwards' : 'npFadeIn 0.3s ease',
        }}
      />

      {/* ── Modal (premium Dribbble-style container) ── */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 440,
          maxWidth: '92vw',
          background: '#ffffff',
          borderRadius: 28,
          boxShadow: '0 30px 100px rgba(0, 0, 0, 0.12), 0 10px 40px rgba(0, 0, 0, 0.06)',
          zIndex: 99999,
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animation: closing
            ? 'npSlideOut 0.25s ease forwards'
            : 'npSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Decorative Top Accent */}
        <div style={{
          height: 6,
          background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
        }} />

        {/* Content area */}
        <div style={{ padding: '40px 36px 32px', textAlign: 'center' }}>
          {/* Success state */}
          {result?.success ? (
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16, animation: 'npPop 0.4s ease' }}>🎉</div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#065f46', letterSpacing: '-0.02em' }}>
                Notifications Enabled!
              </h3>
              <p style={{ margin: '12px 0 0', fontSize: 15, color: '#4b5563', lineHeight: 1.6 }}>
                You're all set! You will now receive real-time updates about events, jobs, and community announcements.
              </p>
            </div>
          ) : failCard ? (
            /* Error / guidance state */
            <>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{failCard.icon}</div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: failCard.color, letterSpacing: '-0.02em' }}>
                {failCard.title}
              </h3>
              <div style={{
                margin: '18px 0',
                padding: '16px 18px',
                background: failCard.bg,
                border: `1px solid ${failCard.border}`,
                borderRadius: 16,
                textAlign: 'left',
              }}>
                <p style={{
                  margin: 0, fontSize: 13.5, color: failCard.color,
                  lineHeight: 1.6, whiteSpace: 'pre-line',
                }}>
                  {failCard.body}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
                {failCard.retryable && (
                  <button
                    onClick={handleEnable}
                    disabled={loading}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 14,
                      padding: '12px 28px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                      opacity: loading ? 0.6 : 1,
                      transition: 'transform 0.1s, opacity 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {loading ? 'Retrying…' : 'Try Again'}
                  </button>
                )}
                <button
                  onClick={handleSkip}
                  style={{
                    background: 'transparent',
                    color: '#4b5563',
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                    padding: '12px 28px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Got it
                </button>
              </div>
            </>
          ) : (
            /* Default design: ask to enable */
            <>
              {/* Sleek, minimalist custom 3D gold & green bell icon */}
              <div style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 130,
                height: 130,
                marginBottom: 20,
                animation: 'npBellWobble 2.5s ease-in-out infinite',
                transformOrigin: 'top center',
              }}>
                <img
                  src="/minimalist_3d_bell.png"
                  alt="3D Bell Icon"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>

              {/* Bold, clean sans-serif headline */}
              <h3 style={{
                margin: '0 0 10px',
                fontSize: 26,
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.03em',
              }}>
                Stay in the Loop!
              </h3>

              {/* Short, easily readable paragraph explaining benefits */}
              <p style={{
                margin: '0 0 24px',
                fontSize: 15,
                color: '#4b5563',
                lineHeight: 1.6,
                fontWeight: 450,
              }}>
                Enable push notifications to receive real-time updates about important events, 
                immediate job alerts, latest news, chat messages, and community announcements.
              </p>

              {/* Visually balanced, single-row grid of subtle, un-clickable badges */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                margin: '0 0 32px',
              }}>
                {[
                  { label: 'Events', color: '#10b981', bg: '#ecfdf5' },
                  { label: 'Jobs', color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'News', color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'Chat', color: '#8b5cf6', bg: '#f5f3ff' },
                  { label: 'Birthdays', color: '#ec4899', bg: '#fdf2f8' },
                ].map((item) => (
                  <span
                    key={item.label}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: item.color,
                      background: item.bg,
                      borderRadius: 12,
                      padding: '6px 14px',
                      userSelect: 'none',
                      letterSpacing: '-0.01em',
                      border: '1px solid rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    {item.label}
                  </span>
                ))}
              </div>

              {/* Balanced call-to-action layout */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}>
                {/* Prominent solid green primary button */}
                <button
                  id="enable-push-btn"
                  onClick={handleEnable}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 16,
                    padding: '15px 32px',
                    fontSize: 15.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.35)';
                    e.currentTarget.style.background = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.25)';
                    e.currentTarget.style.background = '#10b981';
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 16,
                        height: 16,
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: '#ffffff',
                        borderRadius: '50%',
                        animation: 'npSpin 0.6s linear infinite',
                        display: 'inline-block',
                      }} />
                      Setting things up…
                    </span>
                  ) : (
                    'Enable Notifications'
                  )}
                </button>

                {/* Clearly legible, single-line ghost button */}
                <button
                  onClick={handleSkip}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: 14.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    padding: '4px 8px',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#1f2937'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
                >
                  Maybe Later
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Styles & Animations ── */}
      <style>{`
        @keyframes npFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes npFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes npSlideIn {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes npSlideOut {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to   { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
        }
        @keyframes npPop {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes npBellWobble {
          0%, 100% { transform: rotate(0deg); }
          5%       { transform: rotate(10deg); }
          10%      { transform: rotate(-8deg); }
          15%      { transform: rotate(6deg); }
          20%      { transform: rotate(-4deg); }
          25%      { transform: rotate(2deg); }
          30%      { transform: rotate(0deg); }
        }
        @keyframes npSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
