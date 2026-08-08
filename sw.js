var CACHE_NAME = "caesar-city-v19";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Safari refuses to let a service worker satisfy a navigation with a
// redirected Response, so rebuild any redirected response as a plain one.
function stripRedirect(response) {
  if (!response || !response.redirected) return response;
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var fetchPromise = fetch(event.request).then(function (networkResponse) {
        var clean = stripRedirect(networkResponse);
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, clean.clone());
        });
        return clean;
      }).catch(function () { return cached; });
      return cached || fetchPromise;
    })
  );
});
