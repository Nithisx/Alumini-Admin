FCM Troubleshooting and Local Testing

Purpose
- Capture common pitfalls when testing Firebase Cloud Messaging (FCM) and PWAs locally.

Prerequisites
- Ensure your Firebase project has the Web Push certificate (VAPID key) set and matches the VAPID key in `src/lib/firebase.js`.

Why production/preview matters
- Browsers require a real service worker JS file (`/sw.js`) and HTTPS for push notifications.
- Vite dev server often serves `index.html` at `/sw.js` which has MIME `text/html` and will cause SW registration and push subscription errors.

Local reproduction steps (recommended)
1. Build and preview the production bundle (serves `/sw.js` correctly):

```bash
npm run build
npm run preview -- --host
```

2. Open the preview URL (the preview command prints it, e.g. http://localhost:4173).
3. Sign in to the app, allow notifications when requested.
4. Verify in DevTools (Application tab):
   - There is a single Service Worker with a script URL pointing to your built SW (not index.html).
   - `Notification.permission` is `granted`.
   - `localStorage.getItem('FCMToken')` contains a string token.

Testing from a mobile device
- Chrome/Android requires HTTPS for push. Use one of:
  - Deploy to Vercel (recommended) and open the site on your mobile device.
  - Use `ngrok` to tunnel your preview server:

```bash
# start preview on port 4173 (or the port shown by vite preview)
npm run preview -- --port 4173 --host
# in another terminal, run
ngrok http 4173
```

- Open the `https://...` ngrok URL on your device.

Brave and other privacy browsers
- Brave may block push notifications or require explicit user settings. If you see a consistent `AbortError: Registration failed - push service error` only on Brave, test on Chrome to confirm.

Quick debug checklist
- If you get `The script has an unsupported MIME type ('text/html')`:
  - You are running in dev mode; build+preview or deploy to fix.
- If you get `AbortError: Registration failed - push service error`:
  - Open DevTools → Application → Service Workers and remove any unexpected SW registrations (especially any `firebase-messaging-sw.js` registered previously).
  - Clear site storage and try again.

Using the in-app diagnostics
- Navigate to `/fcm-diagnostics` after signing in. The page shows:
  - Active service worker registrations and script URLs.
  - Push subscription checks per registration.
  - The stored `FCMToken` from `localStorage`.
  - Buttons to `Request Permission / Register` (in production) and `Unregister token`.

If problems persist
- Paste the console logs and the output from `/fcm-diagnostics` and I will help interpret them.

