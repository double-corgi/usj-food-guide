const CACHE_NAME = "uniba-food-conquest-v5";
const APP_SHELL = [
  "/",
  "/foods",
  "/eaten",
  "/areas",
  "/complete",
  "/achievements",
  "/manifest.webmanifest",
  "/offline.html",
  "/icons/app-icon.svg",
  "/icons/app-icon-192.png",
  "/icons/app-icon-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          if (url.pathname.startsWith("/foods/")) {
            return (await caches.match("/foods")) || (await caches.match("/")) || Response.redirect("/foods", 302);
          }
          return (await caches.match("/")) || (await caches.match("/offline.html"));
        })
    );
    return;
  }

  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/x-component") || url.searchParams.has("_rsc")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
