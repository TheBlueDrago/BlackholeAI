// Offline test for Monitor → Published sites & games (admin-content), with Base44 (fetch) and
// the KV namespace faked. Run: node scripts/test-content.mjs
const R = new URL("../", import.meta.url).pathname;
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const store = new Map();
const meta = new Map();
const kv = {
  get: async (k, t) => (store.has(k) ? (t === "json" ? JSON.parse(store.get(k)) : store.get(k)) : null),
  getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
  put: async (k, v, o) => { store.set(k, String(v)); meta.set(k, (o && o.metadata) || null); },
  delete: async (k) => store.delete(k),
  list: async () => ({ keys: [] }),
};
const rows = {
  PublishedSite: [
    { id: "a", name: "bakery", html: "https://nebuluxai.pages.dev/published/site/bakery", created_by_id: "u1", created_date: "2026-01-01" },
    { id: "b", name: "bakery", html: "<h1>Fake</h1>", created_by_id: "u666", created_date: "2026-02-01" },
    { id: "c", name: "hand", html: "<html><body><h1>Hello</h1></body></html>", created_by_id: "u2", created_date: "2026-03-01" },
  ],
  PublishedGame: [],
};
globalThis.fetch = async (url) => {
  const p = new URL(String(url)).pathname;
  let body = [];
  if (p.endsWith("/entities/User/me")) body = { id: "admin", role: "admin" };
  else if (p.endsWith("/entities/PublishedSite")) body = rows.PublishedSite;
  else if (p.endsWith("/entities/PublishedGame")) body = rows.PublishedGame;
  return new Response(JSON.stringify(body), { status: 200 });
};
await kv.put("site:bakery", "<html><body><h1>Real bakery</h1></body></html>", { metadata: { owner: "u1" } });
const mod = await import(R + "functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/admin-content.js");
const res = await mod.onRequestPost({ request: new Request("https://x/", { method: "POST", headers: { authorization: "Bearer t" }, body: "{}" }), env: { PUBLISHED_HTML: kv } });
const { items } = await res.json();
const real = items.find((i) => i.name === "bakery" && !i.reasons.some((r) => r.includes("someone else")));
const copy = items.find((i) => i.name === "bakery" && i.reasons.some((r) => r.includes("someone else")));
const hand = items.find((i) => i.name === "hand");
assert(real && real.flag === "green", "the real published page stays green");
assert(copy && copy.flag !== "green" && copy.reasons.some((r) => r.includes("without going through publishing")), "a copycat row is flagged, with why");
assert(hand && hand.flag === "yellow" && hand.reasons[0].includes("without going through publishing"), "a page written straight into the database is flagged yellow");
