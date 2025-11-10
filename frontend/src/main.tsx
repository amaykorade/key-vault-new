import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const STORAGE_VERSION_KEY = 'kv_storage_version';
const CURRENT_STORAGE_VERSION = '2025-11-05';

if (typeof window !== 'undefined') {
  try {
    const storedVersion = window.localStorage.getItem(STORAGE_VERSION_KEY);
    if (storedVersion !== CURRENT_STORAGE_VERSION) {
      const preservedAccessToken = window.localStorage.getItem('accessToken');
      const preservedRefreshToken = window.localStorage.getItem('refreshToken');

      window.localStorage.clear();

      if (preservedAccessToken) {
        window.localStorage.setItem('accessToken', preservedAccessToken);
      }
      if (preservedRefreshToken) {
        window.localStorage.setItem('refreshToken', preservedRefreshToken);
      }

      window.localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    }
  } catch (error) {
    console.warn('[storage] failed to reconcile localStorage state', error);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
