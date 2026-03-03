const CACHE_NAME = 'portfoy-cache-v15';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/sw.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // We only cache the basic HTML, script and manifest
    // Exclude external calls from cache to always get fresh data if online
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Return cached version
                }
                return fetch(event.request);
            })
    );
});
