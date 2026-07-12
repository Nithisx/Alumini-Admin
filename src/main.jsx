import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/axiosInstance';
import { StoreProvider } from './stores';
import App from './App';
import { initUiAnimations } from './lib/uiAnimations';
import { assertConfig } from './config/appConfig';
// Guard PWA registration so missing Vite PWA plugin doesn't break the app
try {
  import('./pwaRegistration');
} catch {
  // ignore; this keeps the app running when the virtual module isn't available
}

// Global scroll-reveal & motion enrichment (no-ops under reduced-motion).
initUiAnimations();

// Config now comes from build-time env vars (config/appConfig.js) instead of a
// `GET /api/v1/config/` round-trip, so there is nothing to await before the
// first render. This logs loudly if a required VITE_* var is missing — the most
// likely way a Vercel build breaks, since these are inlined at build time.
assertConfig();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <StoreProvider>
    <App />
  </StoreProvider>
);
