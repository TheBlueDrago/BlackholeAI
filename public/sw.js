// Service worker: makes the installed app (Safari's "Add to Home Screen", Chrome's Install)
// and repeat visits open fast by keeping the app's own files on the device.
// - /assets/* files have a content hash in their names, so a saved copy is always the right
//   one: downloaded once, then served from the device.
// - The app page for app screens (/, /chat…, sign-in) opens from the device right away and is
//   refreshed in the background, so the next launch has the newest version.
// - Everything else goes to the network untouched: /api (sign-in, data, AI, payments),
//   published sites, the public pages built by the server, and other websites.
// To switch this off for everyone, replace this file with one that calls
// self.registration.unregister() and deletes the caches.
const SHELL = "bh-shell-v1";
const ASSETS = "bh-assets-v1";
const MAX_ASSETS = 250;
const APP_ROUTES = /^\/(chat(\/.*)?|login|register|forgot-password|reset-password|plans|billing|promo-success|ThankYou)?$/;
const isCode = (res) => res && res.ok && !/text\/html/i.test(res.headers.get("content-type") || "");

self.addEventListener("install", (event) => {
  event.waitUntil(refreshShell().catch(() => null).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== SHELL && key !== ASSETS) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

// Downloads the app page and the code it starts with, and saves the page only once its code
// is saved, so a saved page never points at code that isn't there.
let refreshing = null;
function refreshShell() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const res = await fetch("/", { cache: "no-store" });
    if (!res.ok || !/text\/html/i.test(res.headers.get("content-type") || "")) return;
    const html = await res.clone().text();
    const assets = await caches.open(ASSETS);
    const urls = [...new Set(html.match(/\/assets\/[\w.-]+\.(?:js|css)/g) || [])];
    const saved = await Promise.all(
      urls.map(async (url) => {
        if (await assets.match(url)) return true;
        const r = await fetch(url).catch(() => null);
        if (!isCode(r)) return false;
        await assets.put(url, r);
        return true;
      })
    );
    if (saved.every(Boolean)) await (await caches.open(SHELL)).put("/", res);
    await trim(assets);
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// Keeps the newest files (Cache keys come back oldest first).
async function trim(cache) {
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) await cache.delete(key);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate" && req.destination === "document" && APP_ROUTES.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await (await caches.open(SHELL)).match("/");
        event.waitUntil(refreshShell().catch(() => {}));
        return cached || fetch(req);
      })()
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (isCode(res)) {
          event.waitUntil(cache.put(req, res.clone()).catch(() => {}));
        } else {
          // Code from an older version that's gone (a new version was published): drop the saved
          // page so the app's automatic reload (lib/lazyRetry.js) gets the new one.
          event.waitUntil(caches.delete(SHELL));
        }
        return res;
      })()
    );
  }
});
