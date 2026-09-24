// Offline test for unconfirmed emails and removed accounts (cloudflare-lib/bans.js), next to
// test-bans.mjs (bans and blocks). Run: node scripts/test-removal.mjs
import { blockedBy, unverified, accountBlocked, emailRemoved, removedEmailKey } from "../cloudflare-lib/bans.js";
import { applyGrant } from "../cloudflare-lib/credits.js";

let failed = 0;
const assert = (c, m) => {
  console.log((c ? "ok " : "FAIL ") + m);
  if (!c) failed++;
};
const kvOf = () => {
  const m = new Map();
  return {
    m,
    get: async (k, type) => (m.has(k) ? (type === "json" ? JSON.parse(m.get(k)) : m.get(k)) : null),
    put: async (k, v) => void m.set(k, v),
    delete: async (k) => void m.delete(k),
  };
};

const person = { id: "u1", email: "Hi@Example.com", role: "user", is_verified: true };
assert(!blockedBy(person, null), "a normal account isn't blocked");
assert(blockedBy(person, { banned: true }) && blockedBy(person, { removed: true }), "banned and removed accounts are blocked");
assert(unverified({ ...person, is_verified: false }), "an account that never entered its email code is held back");
assert(!unverified({ ...person, is_verified: undefined }) && !unverified({ ...person, is_verified: false, role: "admin" }), "no flag (Google, older accounts) or an admin is never held back");

const kv = kvOf();
assert(await accountBlocked(kv, { ...person, is_verified: false }), "the server refuses an unconfirmed account");
assert(!(await accountBlocked(kv, person)), "and lets a confirmed one through");

// Remove: banned forever, email blocked (any capitalisation, new accounts too), listed for Monitor.
await applyGrant(kv, "u1", { banned: true, blockedUntil: null, removed: true, email: "Hi@Example.com" });
assert(await emailRemoved(kv, "hi@example.com"), "the removed email is blocked");
assert(await accountBlocked(kv, { id: "u2", email: " HI@example.COM ", role: "user", is_verified: true }), "a new account with the same email is blocked too");
assert(await accountBlocked(kv, person), "the removed account itself is blocked");
assert(!(await accountBlocked(kv, { id: "admin1", email: "hi@example.com", role: "admin" })), "an admin is never locked out, even by mistake");
const list = JSON.parse(kv.m.get("removed-users"));
assert(list.length === 1 && list[0].userId === "u1" && list[0].email === "Hi@Example.com", "Monitor's removed list has the account");
await applyGrant(kv, "u1", { banned: true, removed: true, email: "Hi@Example.com" });
assert(JSON.parse(kv.m.get("removed-users")).length === 1, "removing twice doesn't list it twice");

// Restore lifts all of it.
await applyGrant(kv, "u1", { banned: false, blockedUntil: null, removed: false, email: "Hi@Example.com" });
assert(!(await emailRemoved(kv, "hi@example.com")) && !kv.m.has(removedEmailKey("hi@example.com")), "restoring unblocks the email");
assert(!(await accountBlocked(kv, person)), "and the account");
assert(JSON.parse(kv.m.get("removed-users")).length === 0, "and takes it off the removed list");

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
