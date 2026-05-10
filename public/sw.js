const CACHE = "samarth-v1";
const OFFLINE_URL = "/";

// Cache these on install
const PRECACHE = [
  "/",
  "/samarth-logo.webp",
  "/samarth-icon.ico",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests for same-origin navigation
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip API calls — always go to network
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Cache successful page responses
        if (res.ok && event.request.mode === "navigate") {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        // Offline fallback: serve cached version or root
        caches.match(event.request).then((cached) => cached ?? caches.match(OFFLINE_URL))
      )
  );
});
