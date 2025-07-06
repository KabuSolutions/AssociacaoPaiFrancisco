const VERSION = '1.0.0';
// sw.js (Service Worker)
const CACHE_NAME = 'parcelas-cache-v1';
const urlsToCache = [
  './', // Caching the root (index.html)
  './index.html',
  './css/style.css',
  './js/main.js',
  './manifest.json',
  './img/icon-192x192.png',
  './img/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap' // Caching Google Fonts CSS
];

// Instalação: Cacheia os arquivos estáticos
self.addEventListener('install', event => {
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
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});