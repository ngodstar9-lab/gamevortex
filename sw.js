const CACHE_NAME = "gamevortex-shell-v9";
const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./premium.css?v=20261112-2",
  "./visual-refresh.css?v=20261112-2",
  "./script.js",
  "./catalog.js",
  "./public-features.js",
  "./public-experience.js",
  "./admin-studio.js",
  "./admin-enhancements.js",
  "./supabase-config.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./admin.html",
  "./admin.css",
  "./admin.js",
  "./404.html"
];

async function cacheResponse(cache, request, response) {
  if (response && response.ok && response.type !== "opaque") {
    try { await cache.put(request, response.clone()); } catch {}
  }
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // A single missing file must not prevent the rest of the site shell from caching.
    await Promise.all(CORE_FILES.map(async file => {
      try { await cache.add(file); } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("gamevortex-shell-") && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await caches.match(request);

    if (request.mode === "navigate") {
      const controller = new AbortController();
      const timeout = self.setTimeout(() => controller.abort(), 4200);
      try {
        const response = await fetch(request, { signal: controller.signal });
        self.clearTimeout(timeout);
        await cacheResponse(cache, request, response);
        if (response && response.ok) {
          try { await cache.put("./index.html", response.clone()); } catch {}
        }
        return response;
      } catch {
        self.clearTimeout(timeout);
        return cached || await caches.match("./index.html") || Response.error();
      }
    }

    // Cached styles and scripts appear immediately; the network refreshes them in the background.
    if (cached) {
      event.waitUntil((async () => {
        try {
          const response = await fetch(request);
          await cacheResponse(cache, request, response);
        } catch {}
      })());
      return cached;
    }

    try {
      const response = await fetch(request);
      await cacheResponse(cache, request, response);
      return response;
    } catch {
      return Response.error();
    }
  })());
});
