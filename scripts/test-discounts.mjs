// Offline test for discount promo codes (cloudflare-lib/promos.js and discounts.js), with
// Base44 (fetch) and the KV namespace faked. Run: node scripts/test-discounts.mjs
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
};
let purchases = [];
globalThis.fetch = async (url) => {
  const u = new URL(String(url));
  const qp = u.searchParams.get("q") ? JSON.parse(u.searchParams.get("q")) : {};
  let body = [];
  if (u.pathname.endsWith("/entities/Base44Purchase")) body = purchases.filter((x) => x.appUserId === qp.appUserId);
  return new Response(JSON.stringify(body), { status: 200 });
};
const P = await import(R + "cloudflare-lib/promos.js");
const D = await import(R + "cloudflare-lib/discounts.js");
const req = new Request("https://x/", { headers: { authorization: "Bearer t" } });
const fails = async (p, text) => {
  try {
    await p;
    return false;
  } catch (e) {
    return !text || String(e.message).includes(text);
  }
};

// Prices
assert(D.discountedPrice(5, 20) === 4 && D.discountedPrice(1, 30) === 0.7, "20% off $5 is $4; 30% off $1 is $0.70");
assert(D.discountedPrice(1, 90) === 0.5 && D.discountedPrice(4, 100) === 0.5, "never below the $0.50 payment minimum");
assert(D.discountApplies("all", "pro") && D.discountApplies("all", "credits-space-50") && !D.discountApplies("all", "enterprise"), "'everything' covers plans and packs");
assert(D.discountApplies("plans", "team") && !D.discountApplies("plans", "credits-ai-5"), "'all plans' is plans only");
assert(D.discountApplies("credits-galaxy", "credits-galaxy-25") && !D.discountApplies("credits-galaxy", "credits-space-25"), "one AI's packs");

// Admin creates codes
store.set("promos", "[]");
await P.createPromo(kv, req, { code: "save20", kind: "discount", pct: 20, target: "plans", maxUses: 2 });
await P.createPromo(kv, req, { code: "FREE10", aiModel: "ai", credits: 10 });
assert(await fails(P.createPromo(kv, req, { code: "BAD", kind: "discount", pct: 0 }), "between 1% and 100%"), "a 0% discount is refused");
assert(await fails(P.createPromo(kv, req, { code: "BAD2", kind: "discount", pct: 10, target: "nope" })), "an unknown target is refused");

// Checking and claiming
const a = { id: "ua" }, b = { id: "ub" }, c = { id: "uc" };
let d = await P.checkDiscount(kv, req, a, "save20", "pro");
assert(d.pct === 20 && d.target === "plans", "the code is 20% off plans");
assert(await fails(P.checkDiscount(kv, req, a, "SAVE20", "credits-ai-5"), "only for"), "not for credit packs");
const r = await P.redeemPromo(kv, req, a, "save20");
assert(r.kind === "discount" && r.pct === 20, "redeeming a discount code in the Shop just returns the discount");
await P.checkDiscount(kv, req, a, "SAVE20", "pro", { claim: true });
await P.checkDiscount(kv, req, a, "SAVE20", "team", { claim: true });
await P.checkDiscount(kv, req, b, "SAVE20", "pro", { claim: true });
let list = await P.readPromos(kv);
assert(list.find((p) => p.code === "SAVE20").usedBy.length === 2, "claims count people, not tries");
assert(await fails(P.checkDiscount(kv, req, c, "SAVE20", "pro"), "used up"), "a third person can't use a 2-use code");
purchases = [{ appUserId: "ua", status: "paid", productName: "Pro Plan (promo SAVE20)" }];
assert(await fails(P.checkDiscount(kv, req, a, "SAVE20", "team"), "already used"), "someone who paid with the code can't use it again");

// Ending, deactivating, and the free-credit codes still working
await P.createPromo(kv, req, { code: "OLD", kind: "discount", pct: 50, target: "all", expiresAt: "2000-01-01" });
assert(await fails(P.checkDiscount(kv, req, c, "OLD", "pro"), "ended"), "an ended code is refused");
list = await P.readPromos(kv);
await P.updatePromo(kv, req, { id: list.find((p) => p.code === "SAVE20").id, active: false, pct: 30 });
assert(await fails(P.checkDiscount(kv, req, c, "SAVE20", "pro"), "not valid"), "an inactive code is refused");
assert((await P.readPromos(kv)).find((p) => p.code === "SAVE20").pct === 30, "admins can change the %");
assert(await fails(P.checkDiscount(kv, req, c, "FREE10", "pro"), "not valid"), "a free-credit code isn't a discount");
const free = await P.redeemPromo(kv, req, c, "FREE10");
assert(free.credits === 10 && free.aiModel === "ai", "free-credit codes still redeem as before");
