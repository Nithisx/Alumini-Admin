# Alumini-ops — Frontend

React 19 + Vite + Tailwind PWA (deployed on Vercel), refactored from the legacy
`Alumini-Admin` app. The emerald brand theme, every feature, and all role
dashboards are preserved; the refactor adds a backend-driven config bootstrap,
JWT auth with the role in the token payload, and RBAC permission gating.

## What changed vs the legacy frontend

- **No secrets in the bundle.** The only build-time value is `VITE_API_ORIGIN`.
  The VAPID key, Supabase URL + anon key, and WS base are fetched at boot from
  the backend (`GET /api/v1/config/`) — see `src/config/runtimeConfig.js`,
  awaited in `src/main.jsx` before first render.
- **JWT auth, role in the token.** Login stores the backend's `jwt`; the role is
  decoded from its payload (`src/lib/authToken.js`), not a separate `Role` key.
  `src/lib/axiosInstance.js` attaches `Authorization: Bearer <jwt>` (or legacy
  `Token <key>`) to every request — one chokepoint, whole-app coverage.
- **RBAC gating.** `src/stores/permissionStore.js` (MobX) holds the caller's
  effective permissions from `GET /api/v1/me/permissions/`. Gate UI with
  `permissionStore.hasPerm('x.y')` or the `<Can perm="…">` component
  (`src/Components/Shared/Can.jsx`). The Admin *Roles & Permissions* page
  (`src/Components/Admin/RBAC/RolesPermissionsPage.jsx`) edits the matrix.
- **Security headers** (CSP, HSTS, X-Frame-Options, Referrer-Policy,
  Permissions-Policy) in `vercel.json`.

State: existing Redux slices (audit, login-requests) are unchanged; new
cross-cutting state uses MobX stores (config, permissions), per the SonyDev
convention.

## Environment

Only one variable is required — the backend origin. Everything else comes from
the config bootstrap.

```
VITE_API_ORIGIN=https://api.karpagamalumni.in
# dev only:
VITE_API_PROXY_TARGET=http://127.0.0.1:8000   # backend for the /api dev proxy
VITE_APP_MOBILE=false                          # 'true' for Capacitor/WebView builds
```

## Develop

```bash
npm install
npm run dev        # http://localhost:3000 ; /api proxied to VITE_API_PROXY_TARGET
```

With the backend running locally, the dev server proxies `/api` to it (no CORS),
the config bootstrap loads through that proxy, and login issues a JWT.

## Build

```bash
npm run build      # → dist/  (PWA service worker generated)
```

## Auth flow

```
Login → backend returns { jwt, token, role, permissions }
      → storeLoginCredential() saves jwt under "Token"
      → permissionStore.seedFromLogin() populates the permission set
Requests → axiosInstance attaches "Bearer <jwt>"
Role     → decoded from the JWT payload (authToken.getRole())
Logout   → clears token + permissionStore, unregisters push
```
