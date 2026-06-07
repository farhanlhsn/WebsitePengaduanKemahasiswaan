// Service Worker for caching and performance optimization
const STATIC_CACHE = 'static-v3';
const IMAGE_CACHE = 'images-v3';

// Resources to cache immediately (public assets only)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/optimized/logo-ubh.avif',
  '/optimized/logo-ubh.webp',
  '/logo-ubh.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== IMAGE_CACHE) {
              return caches.delete(cacheName);
            }
            return undefined;
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  if (isApiRequest(request) || isUploadRequest(request)) {
    event.respondWith(fetch(request));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else {
    event.respondWith(fetch(request));
  }
});

function isApiRequest(request) {
  const path = new URL(request.url).pathname;
  return path.startsWith('/api/') || path.startsWith('/v1/api/');
}

function isUploadRequest(request) {
  const path = new URL(request.url).pathname;
  return path.startsWith('/uploads/');
}

function isStaticAsset(request) {
  const pathname = new URL(request.url).pathname;
  if (isUploadRequest(request)) return false;
  return /\.(js|css|woff2?|ttf|eot)$/i.test(pathname);
}

function isImageRequest(request) {
  const pathname = new URL(request.url).pathname;
  if (isUploadRequest(request)) return false;
  return /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(pathname);
}

async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    return new Response('Network error', { status: 408 });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/optimized/logo-ubh.png',
      badge: '/optimized/logo-ubh.png',
      data: data.data || {},
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
