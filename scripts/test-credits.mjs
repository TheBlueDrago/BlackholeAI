// Offline test for the server-side credit rules in cloudflare-lib/credits.js, with
// Base44 (fetch) and the KV namespace faked. Run: node scripts/test-credits.mjs
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

// What Base44 answers, per test.
let db = { purchases: [], redemptions: [], team: null };
globalThis.fetch = async (url) => {
  const u = new URL(String(url));
  const p = u.pathname;
  const qp = u.searchParams.get("q") ? JSON.parse(u.searchParams.get("q")) : {};
  let body = [];
  if (p.endsWith("/entities/Base44Purchase")) body = db.purchases.filter((x) => x.appUserId === qp.appUserId);
  else if (p.endsWith("/entities/PromoRedemption")) body = db.redemptions.filter((x) => x.userId === qp.userId);
  else if (p.endsWith("/functions/my-team")) body = { team: db.team };
  else if (p.endsWith("/entities/Team")) body = [];
  return new Response(JSON.stringify(body), { status: 200 });
};

const C = await import(R + "cloudflare-lib/credits.js");
const req = new Request("https://x/", { headers: { authorization: "Bearer t" } });
const status = async (user, opts) => C.creditStatus(kv, await C.entitlement(kv, req, user, opts));
const fresh = () => {
  store.clear();
  db = { purchases: [], redemptions: [], team: null };
};

// Plans
fresh();
let s = await status({ id: "u1" });
assert(s.plan === "free" && s.tiers.ai.total === 50 && s.tiers.aiCode.total === 0 && s.tiers.space5.remaining === 0, "free plan: 50 AI, nothing else");
s = await status({ id: "u1", plan: "secret", bonus: { ai: 999 } });
assert(s.plan === "free" && s.tiers.ai.total === 50, "self-edited User.plan / User.bonus are ignored");
db.purchases = [{ appUserId: "u1", productId: "pro", status: "paid" }, { appUserId: "u1", productId: "team", status: "pending" }];
s = await status({ id: "u1" });
assert(s.plan === "pro" && s.tiers.aiCode.total === 50 && s.tiers.ai.total === 100, "paid purchase gives pro; pending purchase ignored");
await C.applyGrant(kv, "u1", { plan: "team" });
s = await status({ id: "u1" });
assert(s.plan === "team" && s.tiers.aiCode.total === 100, "admin grant raises the plan");
await C.applyGrant(kv, "u1", { plan: "secret", planExpiresAt: "2000-01-01T00:00:00Z" });
s = await status({ id: "u1" });
assert(s.plan === "pro", "expired grant ignored (falls back to the paid plan)");
s = await status({ id: "a1", role: "admin" });
assert(s.plan === "admin", "admins get the admin allowance");

// Bans
fresh();
await C.applyGrant(kv, "u2", { banned: true });
let ent = await C.entitlement(kv, req, { id: "u2" });
assert(ent.blocked === true, "admin ban blocks");
fresh();
await C.applyGrant(kv, "u2", { blockedUntil: new Date(Date.now() + 3600e3).toISOString() });
assert((await C.entitlement(kv, req, { id: "u2" })).blocked === true, "temporary block active");
await C.applyGrant(kv, "u2", { blockedUntil: new Date(Date.now() - 1000).toISOString() });
assert((await C.entitlement(kv, req, { id: "u2" })).blocked === false, "expired block lifted");

// Charging: bonus first, then the monthly allowance
fresh();
await C.adjustBonus(kv, req, { id: "u3" }, "ai", 5);
ent = await C.entitlement(kv, req, { id: "u3" });
await C.charge(kv, ent, "ai", 7);
s = await C.creditStatus(kv, await C.entitlement(kv, req, { id: "u3" }));
assert(s.tiers.ai.used === 2 && s.tiers.ai.remaining === 48 && s.tiers.ai.total === 50, "7 credits: 5 from bonus, 2 from the allowance");
await C.adjustBonus(kv, req, { id: "u3" }, "ai", -100);
s = await status({ id: "u3" });
assert(s.tiers.ai.remaining === 48, "removing more bonus than exists stops at zero");
ent = await C.entitlement(kv, req, { id: "u3" });
await C.charge(kv, ent, "ai", 60);
s = await status({ id: "u3" });
assert(s.tiers.ai.remaining === 0, "remaining never goes below zero");

// Promo credits are applied once
fresh();
db.redemptions = [{ id: "r1", userId: "u4", aiModel: "aiCode", credits: 20, redeemedAt: new Date().toISOString() }];
s = await status({ id: "u4" });
const again = await status({ id: "u4" });
assert(s.tiers.aiCode.total === 20 && again.tiers.aiCode.total === 20, "a promo redemption adds its credits exactly once");

// Team (kept in KV, cloudflare-lib/teams.js): Blackhole Code uses the owner's shared pool
fresh();
const T = await import(R + "cloudflare-lib/teams.js");
const owner = { id: "own", email: "owner@x.com" };
const member = { id: "mem", email: "member@x.com" };
await C.applyGrant(kv, "own", { plan: "team" });
await T.invite(kv, owner, "team", ["Member@x.com", "a@x.com", "b@x.com"]);
const team = await T.readTeam(kv, "own");
assert(team.memberEmails.length === 2 && team.memberEmails[0] === "member@x.com", "team invite: emails cleaned, capped at 2 for Team");
ent = await C.entitlement(kv, req, member);
await C.charge(kv, ent, "aiCode", 3);
s = await C.creditStatus(kv, await C.entitlement(kv, req, owner));
assert(ent.plan === "team" && s.tiers.aiCode.used === 3 && store.get("teamusage:own:" + s.month) === "3", "team members share the owner's Blackhole Code pool");
const mt = await T.myTeam(kv, member, "free", 3);
assert(mt && mt.active && !mt.isOwner && mt.ownerPlan === "team", "my-team shape for a member");
await T.leave(kv, member);
assert((await C.entitlement(kv, req, member)).plan === "free", "a member who leaves is back on free");
await T.invite(kv, owner, "team", ["member@x.com"]);
const stale = await T.readTeam(kv, "own");
stale.ownerPlan = "free";
await T.saveTeam(kv, stale);
assert((await C.entitlement(kv, req, member)).plan === "free", "no team access once the owner's plan is gone");

// Activity for Monitor rides along in the usage record
fresh();
ent = await C.entitlement(kv, req, { id: "u7" });
await C.charge(kv, ent, "ai", 1, "build me a bakery site");
await C.charge(kv, ent, "ai", 1, "make it blue");
const act = await C.activityOf(kv, "u7");
assert(act.prompts === 2 && act.sessions === 1 && act.recent[0].prompt === "make it blue", "activity: prompts, sessions and latest question recorded");

// Credit cost
assert(C.creditsFor("x".repeat(10000), "low") === 1 && C.creditsFor("x".repeat(10001), "low") === 2 && C.creditsFor("hi", "ultracode") === 4, "cost: 1 per started 10,000 chars, times effort");
