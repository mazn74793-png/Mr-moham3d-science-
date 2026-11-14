import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

// Register Service Worker only in production deployments; unregister any stale SW in dev/preview
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isDevOrPreview =
    !import.meta.env.PROD ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('ais-dev-');

  window.addEventListener('load', () => {
    if (isDevOrPreview) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
    } else {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
