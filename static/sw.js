const CACHE_NAME = 'precios-app-v1.0.0';
const STATIC_CACHE = 'static-cache-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-cache-v1.0.0';
const API_CACHE = 'api-cache-v1.0.0';

// Recursos estáticos a cachear
const STATIC_ASSETS = [
  '/',
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/manifest.json',
  '/seleccion',
  '/historial',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Recursos API a cachear
const API_ENDPOINTS = [
  '/api/productos/buscar',
  '/api/historial'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  
  event.waitUntil(
    Promise.all([
      // Cache de recursos estáticos
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache inicial para API (vacío)
      caches.open(API_CACHE).then(cache => {
        console.log('📦 Cache API inicializado');
        return Promise.resolve();
      })
    ]).then(() => {
      console.log('✅ Service Worker: Instalación completada');
      // Forzar activación inmediata
      return self.skipWaiting();
    })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![
              STATIC_CACHE, 
              DYNAMIC_CACHE, 
              API_CACHE
            ].includes(cacheName)) {
              console.log('🗑️ Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar control inmediatamente
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker: Activación completada');
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }

  // Estrategia para diferentes tipos de recursos
  if (request.method === 'GET') {
    
    // API endpoints: Network First con fallback a cache
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirstStrategy(request));
      return;
    }
    
    // Recursos estáticos: Cache First
    if (STATIC_ASSETS.includes(url.pathname) || 
        url.pathname.startsWith('/static/')) {
      event.respondWith(cacheFirstStrategy(request));
      return;
    }
    
    // Páginas HTML: Network First con fallback a cache
    if (request.headers.get('accept').includes('text/html')) {
      event.respondWith(networkFirstStrategy(request));
      return;
    }
    
    // Default: Stale While Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Estrategia Network First (para APIs y páginas)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear respuesta exitosa
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network falló, buscando en cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback offline para APIs
    if (request.url.includes('/api/productos/buscar')) {
      return new Response(JSON.stringify({
        productos: [],
        offline: true,
        mensaje: 'Modo offline - usando datos cacheados'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Estrategia Cache First (para recursos estáticos)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Error cargando recurso estático:', request.url);
    return new Response('Recurso no disponible offline', { 
      status: 503 
    });
  }
}

// Estrategia Stale While Revalidate
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Fetch en background para actualizar cache
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.log('Background fetch falló:', request.url);
  });
  
  // Retornar cache inmediatamente si existe, sino esperar red
  return cachedResponse || fetchPromise;
}

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ size });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ cleared: true });
      });
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
  }
});

// Obtener tamaño del cache
async function getCacheSize() {
  let totalSize = 0;
  
  for (const cacheName of await caches.keys()) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return Math.round(totalSize / 1024); // KB
}

// Limpiar todos los caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Manejar actualizaciones de productos
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-productos') {
    console.log('🔄 Sync background para productos');
    event.waitUntil(syncProductData());
  }
});

// Sync de datos de productos en background
async function syncProductData() {
  try {
    // Aquí podrías implementar lógica para sincronizar
    // datos en background cuando hay conexión
    console.log('✅ Sync de productos completado');
  } catch (error) {
    console.error('❌ Error en sync de productos:', error);
  }
}

// Manejar notificaciones push (futuro)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/static/icons/icon-192x192.png',
      badge: '/static/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: [
        {
          action: 'explore',
          title: 'Ver detalles',
          icon: '/static/icons/icon-96x96.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/static/icons/icon-96x96.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🔧 Service Worker cargado correctamente');