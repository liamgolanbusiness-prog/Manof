// Atar service worker — app-shell cache for offline READS.
// Writes (server actions, uploads) still need network; fallback surfaces a toast
// from the client when that happens.
//
// Strategy:
//   /_next/static/*       → cache-first (content-hashed, safe to cache forever)
//   GET navigation HTML   → network-first, fall back to cache, fall back to /offline
//   storage.googleapis    → stale-while-revalidate (Supabase Storage photos)
//   everything else       → network-first

const SW_VERSION = "v2026-04-20-1";
const STATIC_CACHE = `atar-static-${SW_VERSION}`;
const PAGES_CACHE = `atar-pages-${SW_VERSION}`;
const MEDIA_CACHE = `atar-media-${SW_VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = ["/offline", "/manifest.json", "/favicon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, PAGES_CACHE, MEDIA_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Don't intercept cross-origin requests unless they're Supabase storage
  const sameOrigin = url.origin === self.location.origin;
  const isSupabaseMedia =
    url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/");

  // Skip Supabase API (auth, db) — always fresh, never cache
  if (url.hostname.endsWith(".supabase.co") && !isSupabaseMedia) return;
  // Skip Next.js HMR + SSE endpoints
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;
  if (url.pathname.startsWith("/api/")) return; // writes and CSV exports

  if (!sameOrigin && !isSupabaseMedia) return;

  // Hashed static assets → cache-first
  if (sameOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // Photos / receipts / voice from Supabase storage → stale-while-revalidate
  if (isSupabaseMedia) {
    event.respondWith(staleWhileRevalidate(req, MEDIA_CACHE));
    return;
  }

  // Top-level page navigations → network-first with offline fallback
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(networkFirstPage(req));
    return;
  }

  // Everything else: network-first, cache fallback
  event.respondWith(networkFirst(req, PAGES_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw e;
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("offline", { status: 503, statusText: "offline" });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || networkFetch;
}
