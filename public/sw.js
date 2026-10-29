/* Onda service worker: shell precache + runtime cache.
   El audio descargado vive en IndexedDB, no aqui, para no duplicar espacio. */
const VERSION = "onda-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg", "/icon-maskable.svg"];

const isAudio = (url) => url.pathname.startsWith("/audio/");

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      try {
        const response = await fetch("/index.html", { cache: "no-cache" });
        if (response.ok) {
          const html = await response.clone().text();
          await cache.put("/index.html", response.clone());
          await cache.put("/", response.clone());
          const assets = new Set(SHELL);
          const re = /(?:src|href)="(\/[^"?#]+)"/g;
          let match;
          while ((match = re.exec(html))) {
            if (!isAudio(new URL(match[1], self.location.origin))) assets.add(match[1]);
          }
          await Promise.all(
            [...assets].map(async (url) => {
              if (isAudio(new URL(url, self.location.origin))) return;
              try {
                const hit = await fetch(url, { cache: "no-cache" });
                if (hit.ok) await cache.put(url, hit);
              } catch {
                /* sin red: el runtime cache lo resolvera despues */
              }
            }),
          );
        }
      } catch {
        await cache.addAll(SHELL).catch(() => undefined);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isAudio(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(async () => (await caches.match("/index.html")) || (await caches.match("/")) || Response.error()),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      } catch {
        return Response.error();
      }
    })(),
  );
});
