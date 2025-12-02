// Service Worker para cache de mídia

const CACHE_NAME = 'storecast-media-cache-v1';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

// O Service Worker é ativado
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Exclui caches antigos se o nome mudar
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepta as requisições de fetch
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Apenas faz cache de mídias do DatoCMS
  if (url.hostname === 'www.datocms-assets.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          // Se já estiver no cache, verifica a idade
          if (response) {
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const fetchDate = new Date(dateHeader).getTime();
              const now = new Date().getTime();
              if ((now - fetchDate) / 1000 > MAX_AGE_SECONDS) {
                // Se for muito antigo, busca na rede e atualiza o cache
                return fetchAndCache(event.request, cache);
              }
            }
            // Se estiver no cache e for recente, retorna do cache
            return response;
          }
          
          // Se não estiver no cache, busca na rede e armazena
          return fetchAndCache(event.request, cache);
        });
      })
    );
  }

  // Para outras requisições, apenas busca na rede
  event.respondWith(fetch(event.request));
});

function fetchAndCache(request, cache) {
  return fetch(request).then(networkResponse => {
    // Clona a resposta para poder colocar no cache e retornar
    cache.put(request, networkResponse.clone());
    return networkResponse;
  }).catch(error => {
    console.error('Service Worker: Falha ao buscar e fazer cache.', error);
    // Em caso de falha de rede, retorna um erro
    return new Response('Network error', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  });
}
