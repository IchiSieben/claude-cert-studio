// Minimal offline support: cache-first for the page and its data. The cache name carries VERSION, a hash
// of the cached files stamped by tools/stamp-sw.mjs (a test fails if it is stale), so any content change
// ships a new worker, which drops the old cache on activate.
const VERSION = 'ccs-27b3ad4e8d';
const FILES = ['./', 'index.html', 'data/blueprints.js?v=63e84a76', 'data/questions-ccar-f.js?v=e8ae6be3', 'data/questions-ccdv-f.js?v=2b785ce7', 'data/i18n.js?v=acbf80b9', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'fonts/inter-latin-wght-normal.woff2', 'fonts/geist-mono-latin-wght-normal.woff2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
