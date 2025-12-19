// Define o nome do cache para as mídias. Mude a versão para invalidar o cache.
const MEDIA_CACHE_NAME = 'media-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';
const STATIC_CACHE_NAME = 'static-cache-v1';

const ALL_CACHES = [
  MEDIA_CACHE_NAME,
  DATA_CACHE_NAME,
  STATIC_CACHE_NAME
];

// URLs que devem ser cacheadas na instalação
const urlsToCache = [
  '/',
  '/manifest.json',
  // Adicione aqui outros assets estáticos (CSS, JS, fontes) se necessário
];

// 1. Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache estático aberto.');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Assets estáticos cacheados.');
        return self.skipWaiting(); // Força o SW a se tornar ativo imediatamente
      })
  );
});

// 2. Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Se o cache não estiver na lista de caches atuais, ele é antigo e deve ser deletado.
          if (!ALL_CACHES.includes(cacheName)) {
            console.log(`Service Worker: Deletando cache antigo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Caches antigos limpos.');
      return self.clients.claim(); // Torna o SW o controlador de todas as abas abertas
    })
  );
});

// 3. Interceptação de Requisições (Fetch)
self_addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia: Cache First para mídias (imagens/vídeos)
  // Verifica se a URL é de uma mídia (upload da DatoCMS ou similar)
  if (url.hostname === 'www.datocms-assets.com') {
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // console.log(`Service Worker: Servindo do cache de mídia: ${request.url}`);
          return cachedResponse;
        }
        
        // console.log(`Service Worker: Buscando na rede e cacheando mídia: ${request.url}`);
        const networkResponse = await fetch(request);
        // Clona a resposta para poder colocar no cache e retornar para o navegador
        cache.put(request, networkResponse.clone());
        return networkResponse;
      })
    );
  }
  // Estratégia: Network First para a API do DatoCMS (para obter sempre os dados mais recentes)
  else if (url.hostname === 'graphql.datocms.com') {
     event.respondWith(
        fetch(request)
          .then((networkResponse) => {
            // Se a requisição for bem-sucedida, atualiza o cache de dados
            const cache = caches.open(DATA_CACHE_NAME);
            cache.then(c => c.put(request, networkResponse.clone()));
            return networkResponse;
          })
          .catch(async () => {
            // Se a rede falhar, tenta pegar do cache
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                console.log(`Service Worker: Servindo dados da API do cache (offline): ${request.url}`);
                return cachedResponse;
            }
            return new Response(null, { status: 503, statusText: 'Service Unavailable' });
          })
      );
  }
  // Estratégia: Cache First para assets estáticos
  else {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).catch(() => {
            // Fallback para página offline pode ser adicionado aqui
            return new Response(null, { status: 404, statusText: 'Not Found' });
        });
      })
    );
  }
});


// 4. Ouvinte de Mensagens
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_MEDIA_CACHE') {
    console.log('Service Worker: Recebida solicitação para limpar o cache de mídia.');
    event.waitUntil(
      caches.delete(MEDIA_CACHE_NAME)
        .then(() => {
          console.log(`Service Worker: Cache '${MEDIA_CACHE_NAME}' deletado com sucesso.`);
          // Opcional: Re-abrir o cache vazio se necessário
          return caches.open(MEDIA_CACHE_NAME);
        })
        .catch(err => {
          console.error(`Service Worker: Falha ao deletar o cache '${MEDIA_CACHE_NAME}'.`, err);
        })
    );
  }
});
