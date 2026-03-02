const CACHE_NAME = "match-three-v1";

// Only cache the "shells" initially
const INITIAL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/spritesheet.png",
  "./assets/spark.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(INITIAL_ASSETS)),
  );
});

// Dynamic caching: Cache any request that isn't in the cache yet
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Only cache successful responses and ignore browser extensions/external APIs
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    }),
  );
});
