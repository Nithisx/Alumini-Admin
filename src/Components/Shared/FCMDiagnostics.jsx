import React, { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  unregisterNotificationToken,
  onForegroundMessage,
} from '../../lib/webpush';
import { getRole } from '../../lib/authToken';

export default function FCMDiagnostics() {
  const [regs,       setRegs]       = useState([]);
  const [subs,       setSubs]       = useState([]);
  const [storedSub,  setStoredSub]  = useState(null);
  const [permission, setPermission] = useState(Notification.permission);
  const [ua]                        = useState(navigator.userAgent);
  const [log,        setLog]        = useState([]);

  const append = (m) => setLog((s) => [...s, `${new Date().toLocaleTimeString()}: ${m}`]);

  async function refresh() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      setRegs(registrations.map((r) => ({
        scope:     r.scope,
        scriptURL: r.active?.scriptURL,
        state:     r.active?.state,
      })));

      const subChecks = await Promise.all(registrations.map(async (r) => {
        try {
          const sub = r.pushManager ? await r.pushManager.getSubscription() : null;
          return {
            scope:       r.scope,
            hasSubscription: !!sub,
            endpoint:    sub?.endpoint?.slice(0, 60) + (sub ? '…' : ''),
          };
        } catch (e) {
          return { scope: r.scope, error: String(e) };
        }
      }));

      setSubs(subChecks);

      const raw = localStorage.getItem('pushSubscription');
      setStoredSub(raw ? JSON.parse(raw) : null);
      setPermission(Notification.permission);
      append('Refreshed diagnostics');
    } catch (e) {
      append('Failed to refresh: ' + String(e));
    }
  }

  useEffect(() => {
    refresh();
    const unsub = onForegroundMessage((payload) => {
      const d = payload?.data || {};
      append('Foreground push: ' + (d.title || JSON.stringify(d)));
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Push Diagnostics</h2>
      <p><strong>User agent:</strong> {ua}</p>
      <p><strong>Notification permission:</strong> {permission}</p>
      <p>
        <strong>Stored subscription endpoint:</strong>{' '}
        {storedSub?.endpoint
          ? <span style={{ wordBreak: 'break-all', fontSize: 12 }}>{storedSub.endpoint}</span>
          : '—'}
      </p>

      <div style={{ marginTop: 12 }}>
        <button onClick={refresh} style={{ marginRight: 8 }}>Refresh</button>
        <button
          onClick={async () => {
            append('Requesting permission…');
            const result = await requestNotificationPermission(getRole());
            const raw = localStorage.getItem('pushSubscription');
            setStoredSub(raw ? JSON.parse(raw) : null);
            setPermission(Notification.permission);
            append(`requestNotificationPermission → ${JSON.stringify(result)}`);
          }}
          style={{ marginRight: 8 }}
        >
          Request Permission / Subscribe
        </button>
        <button
          onClick={async () => {
            append('Unregistering subscription…');
            await unregisterNotificationToken(getRole());
            setStoredSub(null);
            setPermission(Notification.permission);
            append('unregisterNotificationToken finished.');
          }}
        >
          Unregister
        </button>
      </div>

      <h3 style={{ marginTop: 18 }}>Service Workers</h3>
      <pre style={{ background: '#f6f6f6', padding: 12, overflowX: 'auto' }}>
        {JSON.stringify(regs, null, 2)}
      </pre>

      <h3>Push Subscription Checks</h3>
      <pre style={{ background: '#f6f6f6', padding: 12, overflowX: 'auto' }}>
        {JSON.stringify(subs, null, 2)}
      </pre>

      <h3>Stored Subscription</h3>
      <pre style={{ background: '#f6f6f6', padding: 12, overflowX: 'auto', wordBreak: 'break-all' }}>
        {storedSub ? JSON.stringify(storedSub, null, 2) : '—'}
      </pre>

      <h3>Logs</h3>
      <div style={{ background: '#111', color: '#fff', padding: 12, maxHeight: 240, overflow: 'auto' }}>
        {log.map((l, i) => (
          <div key={i} style={{ fontFamily: 'monospace', fontSize: 12 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}
