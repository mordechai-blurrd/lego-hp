/* ════════════════════════════════════════════════
   ⚡ HP LEGO Builder — Service Worker v1
════════════════════════════════════════════════ */

const CACHE_NAME = 'hpbuilder-v1';
const APP_SHELL  = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow('./index.html');
    })
  );
});

self.addEventListener('push', event => {
  const data  = event.data ? event.data.json() : {};
  const title = data.title || '⚡ HP LEGO Builder';
  const body  = data.body  || 'Time to complete your daily quest! 🧱';
  event.waitUntil(
    self.registration.showNotification(title, {
      body, icon: './icon.svg', badge: './icon.svg',
      tag: 'hp-checkin', renotify: true, vibrate: [200, 100, 200]
    })
  );
});
