import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/axiosInstance';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
// Guard PWA registration so missing Vite PWA plugin doesn't break the app
try {
  import('./pwaRegistration');
} catch (e) {
  // ignore; this keeps the app running when the virtual module isn't available
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
