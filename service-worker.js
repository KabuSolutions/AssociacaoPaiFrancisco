const VERSION = '1.0.0';
// service-worker.js (Service Worker)
const CACHE_VERSION = "__CACHE_VERSION__";
const CACHE_NAME = `associacao-cache-${CACHE_VERSION}`;
const urlsToCache = [
  './', // Caching the root (index.html)
  './index.html',
  './css/style.css',
  './js/main.js',
  './manifest.json',
  './img/icon-48x48.png',
  './img/icon-72x72.png',
  './img/icon-96x96.png',
  './img/icon-128x128.png',
  './img/icon-144x144.png',
  './img/icon-152x152.png',
  './img/icon-192x192.png',
  './img/icon-256x256.png',
  './img/icon-384x384.png',
  './img/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap' // Caching Google Fonts CSS
];

// Instalação: Cacheia os arquivos estáticos
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Busca: Serve arquivos do cache primeiro, depois da rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna resposta
        if (response) {
          return response;
        }
        // Não está no cache - busca na rede
        return fetch(event.request);
      })
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames.
          filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => {
      return self.clients.claim();
    })
  );
});