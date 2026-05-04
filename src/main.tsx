import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __bciInstallPromptEvent?: Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    };
    __bciRefreshApp?: () => Promise<void>;
  }
}

// DISABLE SERVICE WORKER REGISTRATION
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     void navigator.serviceWorker.register('/sw.js').catch((error) => {
//       console.warn('Service worker registration failed', error);
//     });
//   });
// }

window.__bciRefreshApp = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(async (registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        await registration.update();
      }));
    }
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.filter((key) => key.startsWith('bci-field-service-')).map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn('App refresh reset failed', error);
  } finally {
    window.location.reload();
  }
};

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  window.__bciInstallPromptEvent = event as Window['__bciInstallPromptEvent'];
  window.dispatchEvent(new Event('bci-install-available'));
});

window.addEventListener('appinstalled', () => {
  window.__bciInstallPromptEvent = undefined;
  window.dispatchEvent(new Event('bci-install-installed'));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
