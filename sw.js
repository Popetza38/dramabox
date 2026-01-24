/**
 * DramaPop Service Worker
 * Provides offline caching and performance optimization
 */

const CACHE_NAME = 'dramapop-v3';
const STATIC_CACHE = 'dramapop-static-v3';
const DYNAMIC_CACHE = 'dramapop-dynamic-v3';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/detail.html',
    '/watch.html',
    '/search.html',
    '/category.html',
    '/history.html',
    '/offline.html',
    '/css/style.css',
    '/js/api.js',
    '/js/common.js',
    '/js/i18n.js',
    '/js/home.js',
    '/js/detail.js',
    '/js/watch.js',
    '/js/search.js',
    '/js/category.js',
    '/js/history.js',
    '/manifest.json',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg'
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Niramit:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] Caching static assets...');
                return cache.addAll(STATIC_ASSETS.map(url => {
                    return new Request(url, { cache: 'reload' });
                })).catch(err => {
                    console.warn('[SW] Some static assets failed to cache:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                        .map(key => {
                            console.log('[SW] Removing old cache:', key);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    // Skip video files to avoid "Response body already used" errors
    if (url.pathname.match(/\.(mp4|m3u8|ts|key|mov)$/i)) {
        return;
    }

    // API requests - Network first, then cache
    if (url.href.includes('dramabos.asia/api') || url.href.includes('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Image requests - Cache first, then network
    if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Static assets - Cache first
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset) || url.pathname === asset)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // HTML pages - Network first with offline fallback
    if (request.destination === 'document' || url.pathname.endsWith('.html')) {
        event.respondWith(networkFirstWithOfflineFallback(request));
        return;
    }

    // Everything else - Stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// Cache-first strategy
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Cache first failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

// Network-first strategy
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return new Response(JSON.stringify({ success: false, message: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Network first with offline fallback
async function networkFirstWithOfflineFallback(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        // Return offline page
        return caches.match('/offline.html');
    }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);

    const networkPromise = fetch(request).then(async response => {
        if (response.ok) {
            // Clone response BEFORE using it
            const responseToCache = response.clone();
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, responseToCache);
        }
        return response;
    }).catch(() => cached);

    return cached || networkPromise;
}

// Listen for messages from the main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(keys => {
                return Promise.all(keys.map(key => caches.delete(key)));
            })
        );
    }
});

// Background sync for offline actions (future feature)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-watch-history') {
        event.waitUntil(syncWatchHistory());
    }
});

async function syncWatchHistory() {
    // Sync watch history when back online
    console.log('[SW] Syncing watch history...');
}
