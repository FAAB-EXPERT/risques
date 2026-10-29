import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __fpllanDeferredPrompt?: any;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__fpllanDeferredPrompt = e;
    window.dispatchEvent(new CustomEvent('fpllan-pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    window.__fpllanDeferredPrompt = null;
    window.dispatchEvent(new CustomEvent('fpllan-pwa-installed'));
  });

  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => {
        keys.forEach((key) => {
          if (key !== 'faab-risk-pwa-cache-v20261029') {
            caches.delete(key).catch(() => {});
          }
        });
      })
      .catch(() => {});
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js?v=20261029')
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(() => {
          // Ignore registration error in restricted preview frames
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
