/* Área Fria Concept — cache V31 • lavagem J-3902 integral */
const CACHE = 'u39-area-fria-concept-v31-lavagem-j3902-integral';
const SHELL = [
  './',
  './index.html',
  './styles.css?v=31',
  './app.js?v=31',
  './manifest.json',
  './equalizacao-j3902-e3907.html?v=28',
  './Lavagem-J-3902-Concept-Interativo.html?v=31',
  './parada-esgotamento-dea-u39.html?v=28',
  './parada-u39-fo39143-ci3907.html?v=28',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('u39-area-fria-concept-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, {cache: 'no-store'});
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(c => c.put(event.request, copy)).catch(() => {});
      }
      return response;
    } catch (err) {
      return (await caches.match(event.request)) ||
             (event.request.mode === 'navigate' ? await caches.match('./index.html') : Response.error());
    }
  })());
});
