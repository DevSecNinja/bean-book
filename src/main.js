import { initApp } from './app.js';

const BUILD_ID = '__BUILD_ID__';

const root = document.getElementById('app');
if (root) {
  initApp(root, { buildId: BUILD_ID }).catch((err) => {
    console.error(err);
    root.innerHTML = '';
    const p = document.createElement('p');
    p.setAttribute('role', 'alert');
    p.className = 'error';
    p.textContent = 'Failed to load Bean Book. Please refresh.';
    root.append(p);
  });
}

// Register the service worker for PWA / offline support.
// The `?v=` query string and BUILD_ID are stamped at deploy time so every
// commit triggers an update (see .github/workflows/ci-cd.yml).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    const reloadOnce = () => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) reloadOnce();
    });

    navigator.serviceWorker
      .register('/service-worker.js?v=__BUILD_ID__', { scope: '/', updateViaCache: 'none' })
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              reloadOnce();
            }
          });
        });
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
      })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
