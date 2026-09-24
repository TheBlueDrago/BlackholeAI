// Offline test for the admin log (cloudflare-lib/audit.js) and that the admin endpoints
// write to it, with Base44 (fetch) and the KV namespace faked. Run: node scripts/test-audit.mjs
const R = new URL("../", import.meta.url).pathname;
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const store = new Map();
const kv = {
  get: async (k, t) => (store.has(k) ? (t === "json" ? JSON.parse(store.get(k)) : store.get(k)) : null),
  put: async (k, v) => store.set(k, String(v)),
  delete: async (k) => store.delete(k),
  list: async () => ({ keys: [] }),
};
let me = { id: "admin1", email: "boss@example.com", role: "admin" };
globalThis.fetch = async (url) => {
  const p = new URL(String(url)).pathname;
  let body = [];
  if (p.endsWith("/entities/User/me")) body = me;
  else if (/\/entities\/User\/[^/]+$/.test(p)) body = { id: p.split("/").pop(), email: "kid@example.com" };
  return new Response(JSON.stringify(body), { status: 200 });
};
const A = await import(R + "cloudflare-lib/audit.js");
const F = R + "functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/";
const call = async (name, body) => {
  const mod = await import(F + name + ".js");
  const request = new Request("https://x/", { method: "POST", headers: { authorization: "Bearer t", "content-type": "application/json" }, body: JSON.stringify(body) });
  const res = await (mod.onRequestPost || mod.onRequest)({ request, env: { PUBLISHED_HTML: kv } });
  return { status: res.status, data: await res.json() };
};

await A.logAdmin(kv, me, "test", { a: 1 });
let log = await A.readAdminLog(kv);
assert(log.length === 1 && log[0].by === "boss@example.com" && log[0].what === "test" && log[0].at, "an entry records who, what and when");

await call("admin-grant", { grants: [{ userId: "u7", plan: "pro", banned: true }] });
await call("admin-credits", { userId: "u7", action: "adjust", tier: "galaxy5", delta: 25 });
store.set("promos", "[]");
await call("manage-promos", { action: "create", code: "half", kind: "discount", pct: 50, target: "all" });
log = await A.readAdminLog(kv);
assert(log[0].what === "promo-create" && log[0].details.pct === 50, "creating a promo code is logged");
assert(log[1].what === "credits" && log[1].details.delta === 25 && log[1].details.tier === "galaxy5", "giving credits is logged");
assert(log[2].what === "grant" && log[2].details.plan === "pro" && log[2].details.banned === true, "plan and ban changes are logged");

// Non-admins can't read it or add to it
me = { id: "u9", email: "kid@example.com", role: "user" };
const r = await call("admin-log", {});
assert(r.status === 403, "only admins can read the admin log");
await call("admin-credits", { userId: "u9", action: "adjust", tier: "ai", delta: 999 });
assert((await A.readAdminLog(kv)).length === log.length, "a refused non-admin call writes nothing");

// Capped, and a broken store never throws
for (let i = 0; i < 320; i++) await A.logAdmin(kv, { email: "x" }, "n", {});
assert((await A.readAdminLog(kv)).length === 300, "the log keeps the newest 300");
await A.logAdmin({ get: async () => { throw new Error("down"); }, put: async () => { throw new Error("down"); } }, me, "x");
assert(true, "a failed log write doesn't throw");
