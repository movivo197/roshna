/* روشنا: generated build ID is injected by prepare-standalone.mjs. */
const BUILD_ID = "__ROSHANA_BUILD_ID__";
const CACHE_PREFIX = "roshana-offline-";
const CACHE_NAME = CACHE_PREFIX + BUILD_ID;
const STATUS_KEY = "/__roshana_offline_status__";
const isStatic = (url) => url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/") ||
   url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest");

async function offlineStatus() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(STATUS_KEY);
  if (!response) return { ready: false, version: BUILD_ID };
  const manifest = await response.json();
  const found = await Promise.all(manifest.urls.map((url) => cache.match(url)));
  return { ready: found.every(Boolean), version: BUILD_ID, assets: found.filter(Boolean).length };
}

async function prepareOffline() {
    // A development server must never claim to be ready for offline use.
    if (BUILD_ID === "__ROSHANA_BUILD_ID__") throw new Error("Production offline manifest required");
    const response = await fetch("/offline-manifest.json", { cache: "no-store", credentials: "omit" });
    if (!response.ok) throw new Error("Offline manifest is unavailable");
    const manifest = await response.json();
    if (manifest.version !== BUILD_ID || !Array.isArray(manifest.assets) || !manifest.assets.length) {
      throw new Error("Offline manifest does not match this build");
    }
    const urls = ["/", ...manifest.assets];
    if (manifest.assets.some((path) => typeof path !== "string" || !isStatic(new URL(path, self.location.origin)))) {
      throw new Error("Unsafe offline asset path");
    }
    const cache = await caches.open(CACHE_NAME);
    try {
      // Limit parallel requests on slower mobile connections.
      let next = 0;
      await Promise.all(Array.from({ length: Math.min(6, urls.length) }, async () => {
        while (next < urls.length) {
          const url = urls[next++];
          const asset = await fetch(url, { cache: "reload", credentials: "omit" });
          if (!asset.ok || asset.type === "opaque" || asset.redirected) throw new Error("Cannot cache " + url);
          if (url === "/" && !asset.headers.get("content-type")?.includes("text/html")) {
            throw new Error("Offline home document is not HTML");
          }
          await cache.put(url, asset);
        }
      }));
      await cache.put(STATUS_KEY, new Response(JSON.stringify({ urls }), {
        headers: { "content-type": "application/json" },
      }));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
}

self.addEventListener("install", (event) => {
  // Deliberately no skipWaiting(): the user chooses when to apply an update.
  event.waitUntil(prepareOffline());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const older = (await caches.keys()).filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);
    // Keep one previous build for tabs that still have its JavaScript loaded.
    await Promise.all(older.slice(0, -1).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "APPLY_UPDATE") {
    event.waitUntil(self.skipWaiting());
  } else if (event.data?.type === "OFFLINE_STATUS") {
    event.waitUntil(offlineStatus().then((status) => event.ports[0]?.postMessage(status)));
  } else if (event.data?.type === "PREPARE_OFFLINE") {
    event.waitUntil(prepareOffline().then(offlineStatus)
      .then((status) => event.ports[0]?.postMessage(status))
      .catch(() => event.ports[0]?.postMessage({ ready: false, version: BUILD_ID })));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Never intercept API calls, admin documents, authentication or RSC fetches.
  if (request.mode === "navigate" && url.pathname === "/") {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch {
        const saved = await (await caches.open(CACHE_NAME)).match("/");
        return saved || new Response("برای آماده‌سازی نسخه آفلاین، یک بار به اینترنت وصل شوید.", {
          status: 503, headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    })());
  } else if (isStatic(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const saved = await cache.match(request);
      if (saved) return saved;
      // A tab left open during a release may still request its previous chunks.
      const keys = (await caches.keys()).filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);
      for (const key of keys) {
        const previous = await (await caches.open(key)).match(request);
        if (previous) return previous;
      }
      const response = await fetch(request);
      if (response.ok && response.type !== "opaque" && !response.redirected) await cache.put(request, response.clone());
      return response;
    })());
  }
});
