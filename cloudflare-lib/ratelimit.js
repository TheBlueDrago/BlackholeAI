// A light throttle for endpoints that write to KV (whose free tier allows 1,000 writes
// a day for everything, credits included), so one account or visitor calling them in
// a loop can't use the quota up. Counts live in Cloudflare's edge cache (caches.default),
// which is free and costs no KV operations. It's per data centre and not atomic —
// enough to stop a runaway client, not an exact meter. Where the Cache API isn't
// available (e.g. local tests) it allows everything.
const ORIGIN = "https://ratelimit.blackhole.internal/";

// Returns true if this call is allowed: at most `max` calls per `windowSec` for `key`.
export async function allow(key, max, windowSec) {
  const cache = typeof caches !== "undefined" && caches.default;
  if (!cache) return true;
  try {
    const slot = Math.floor(Date.now() / 1000 / windowSec);
    const req = new Request(`${ORIGIN}${encodeURIComponent(key)}/${slot}`);
    const hit = await cache.match(req);
    const n = hit ? Number(await hit.text()) || 0 : 0;
    if (n >= max) return false;
    await cache.put(req, new Response(String(n + 1), { headers: { "cache-control": `max-age=${windowSec}` } }));
    return true;
  } catch {
    return true;
  }
}

// For counting only some calls (say, wrong guesses): `hits` reads the count for `key` in
// the current window without adding to it, and `bump` adds one. Same storage as allow().
export async function hits(key, windowSec) {
  const cache = typeof caches !== "undefined" && caches.default;
  if (!cache) return 0;
  try {
    const slot = Math.floor(Date.now() / 1000 / windowSec);
    const hit = await cache.match(new Request(`${ORIGIN}${encodeURIComponent(key)}/${slot}`));
    return hit ? Number(await hit.text()) || 0 : 0;
  } catch {
    return 0;
  }
}

export async function bump(key, windowSec) {
  await allow(key, Infinity, windowSec);
}

export const TOO_MANY = "You're doing that too often. Please wait a few minutes and try again.";
