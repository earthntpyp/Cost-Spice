// cost.spice service worker — bump CACHE version when deploying breaking changes
const CACHE = 'costspice-v2';
const ASSETS = ['.', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first with cache fallback: always fresh when online, still works offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Don't intercept cross-origin requests (FX API, Google Fonts) — let the browser handle them
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(r =>
          r || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error())
        )
      )
  );
});
