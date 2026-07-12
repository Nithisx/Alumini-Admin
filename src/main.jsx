import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/axiosInstance';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { StoreProvider } from './stores/StoreContext';
import App from './App';
import { initUiAnimations } from './lib/uiAnimations';
import { loadRuntimeConfig } from './config/runtimeConfig';
// Guard PWA registration so missing Vite PWA plugin doesn't break the app
try {
  import('./pwaRegistration');
} catch {
  // ignore; this keeps the app running when the virtual module isn't available
}

// Global scroll-reveal & motion enrichment (no-ops under reduced-motion).
initUiAnimations();

// Fetch backend config (API/WS base, VAPID key, Supabase URL+key) BEFORE first
// render, so no secret is baked into the bundle and every config getter is
// populated by first paint. Never throws — falls back to localStorage cache,
// then to env defaults, so the PWA shell still boots offline.
loadRuntimeConfig().finally(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    // Redux Provider stays during the MobX migration (stores are converted
    // domain by domain; both coexist until the last Redux consumer is gone).
    <StoreProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </StoreProvider>
  );
});
