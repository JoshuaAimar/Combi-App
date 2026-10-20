// sw.js — "service worker": guarda los archivos de la app en el teléfono
// para que abra aunque no haya internet.
// IMPORTANTE: cada vez que cambien un archivo de la app, cambien también
// el número de VERSION para que el teléfono descargue la versión nueva.

const VERSION = 'combi-v2';
const ARCHIVOS = [
  './',
  'index.html',
  'styles.css',
  'datos.js',
  'app.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'logo.png',
  'apple-touch-icon.png'
];

// Al instalarse, guarda todos los archivos.
self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSION).then(function (cache) { return cache.addAll(ARCHIVOS); })
  );
  self.skipWaiting();
});

// Al activarse, borra versiones viejas.
self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(
        nombres.filter(function (n) { return n !== VERSION; })
               .map(function (n) { return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// Cuando la app pide un archivo, primero lo busca en lo guardado.
self.addEventListener('fetch', function (evento) {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    caches.match(evento.request).then(function (guardado) {
      return guardado || fetch(evento.request);
    })
  );
});
