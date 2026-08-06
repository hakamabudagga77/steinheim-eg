/* Steinheim Egypt — offline-first service worker.
 *
 * Deliberately conservative: only same-origin GETs are intercepted, API
 * responses are never cached (prices/inventory must stay live), and large
 * media (videos, the PDF catalogue) is skipped so the cache cannot balloon.
 * Navigations are network-first with a cached-page fallback so a returning
 * shopper still lands on the site offline.
 */
const CACHE = "steinheim-shell-v1";

const SKIP_PATH = /^\/api\//;
const SKIP_EXT = /\.(mp4|webm|mov|pdf)$/i;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function shouldCache(url) {
  return (
    url.origin === self.location.origin &&
    !SKIP_PATH.test(url.pathname) &&
    !SKIP_EXT.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!shouldCache(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match("/en") || caches.match("/"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok && shouldCache(url)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
