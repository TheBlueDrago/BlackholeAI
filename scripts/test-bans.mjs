// Offline test for bans and blocks (cloudflare-lib/bans.js): an account an admin banned or
// blocked can't publish, use promo codes, claim referral credits, invite team members or feature
// a site, and editing its own User row can't lift that. Base44 (fetch) and KV are faked.
// Run: node scripts/test-bans.mjs
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const R = (p) => new URL("../" + p, import.meta.url).href;
const { blockedBy, accountBlocked } = await import(R("cloudflare-lib/bans.js"));

const now = new Date("2026-09-24T12:00:00Z");
const later = "2026-09-25T12:00:00Z";
const earlier = "2026-09-23T12:00:00Z";
assert(!blockedBy({ id: "u" }, null, now), "an ordinary account isn't blocked");
assert(blockedBy({ id: "u" }, { banned: true }, now), "an admin ban blocks");
assert(blockedBy({ id: "u" }, { blockedUntil: later }, now) && !blockedBy({ id: "u" }, { blockedUntil: earlier }, now), "a timed block lasts until it ends");
assert(blockedBy({ id: "u", banned: false, blockedUntil: null }, { banned: true }, now), "clearing the flags on your own User row doesn't lift an admin ban");
assert(blockedBy({ id: "u", banned: true }, null, now), "the User row can still add a block");

const store = new Map();
const kv = {
  get: async (k, t) => (store.has(k) ? (t === "json" ? JSON.parse(store.get(k)) : store.get(k)) : null),
  put: async (k, v) => store.set(k, String(v)),
  delete: async (k) => store.delete(k),
  list: async () => ({ keys: [] }),
  getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: null }),
};
assert(!(await accountBlocked(kv, { id: "boss", role: "admin", banned: true })), "an admin is never locked out");
assert(!(await accountBlocked({ get: async () => { throw new Error("down"); } }, { id: "u" })), "if KV can't be read, only the User row counts");

// The endpoints, as a banned user.
let me = { id: "bad1", email: "bad@example.com", role: "user", full_name: "Bad" };
store.set("grant:bad1", JSON.stringify({ banned: true }));
store.set("promos", "[]");
globalThis.fetch = async (url) => {
  const p = new URL(String(url)).pathname;
  if (p.endsWith("/entities/User/me")) return new Response(JSON.stringify(me));
  if (p.includes("/entities/")) return new Response("[]");
  return new Response("{}");
};
const F = "functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/";
const call = async (name, body) => {
  const mod = await import(R(F + name + ".js"));
  const request = new Request("https://x/", { method: "POST", headers: { authorization: "Bearer t", "content-type": "application/json", "cf-connecting-ip": "5.5.5.5" }, body: JSON.stringify(body) });
  const res = await (mod.onRequestPost || mod.onRequest)({ request, env: { PUBLISHED_HTML: kv } });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
const writesBefore = store.size;
for (const [name, body, what] of [
  ["publish-site", { name: "mysite", html: "<!DOCTYPE html><html><body><h1>Hi</h1></body></html>" }, "publishing a site"],
  ["publish-game", { name: "mygame", html: "<!DOCTYPE html><html><body><canvas></canvas></body></html>", title: "G" }, "publishing a game"],
  ["redeem-promo", { code: "ANYTHING" }, "redeeming a promo code"],
  ["promo-discount", { code: "ANYTHING", productId: "pro" }, "checking a discount code"],
  ["referrals", { action: "claim-welcome", tier: "ai" }, "claiming referral credits"],
  ["team-invite", { emails: ["friend@example.com"] }, "inviting team members"],
  ["showcase", { action: "set", name: "mysite", on: true }, "featuring a site in the gallery"],
]) {
  const r = await call(name, body);
  assert(r.status === 403 && /blocked/.test(r.data.error || ""), `a banned account is refused ${what}`);
}
assert(store.size === writesBefore, "and nothing was saved");

// Banned people can still reach us and report pages.
const contact = await call("contact", { action: "send", topic: "account", message: "Why was I blocked?" });
assert(contact.status === 200, "a banned account can still contact us");

// Once the ban is lifted, the same calls go through to their normal checks.
store.set("grant:bad1", JSON.stringify({ banned: false }));
const r = await call("redeem-promo", { code: "ANYTHING" });
assert(r.status === 400 && !/blocked/.test(r.data.error || ""), "after the ban is lifted, a wrong code gets the normal answer");
