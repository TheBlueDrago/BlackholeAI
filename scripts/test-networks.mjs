// Offline test for the accounts-per-network limit (cloudflare-lib/networks.js).
// Run: node scripts/test-networks.mjs
import { noteAccount, networkFull, NETWORK_LIMIT } from "../cloudflare-lib/networks.js";
import { applyGrant } from "../cloudflare-lib/credits.js";
import { blockedBy } from "../cloudflare-lib/bans.js";

let failed = 0;
const assert = (c, m) => {
  console.log((c ? "ok " : "FAIL ") + m);
  if (!c) failed++;
};
const m = new Map();
const kv = {
  get: async (k, t) => (m.has(k) ? (t === "json" ? JSON.parse(m.get(k)) : m.get(k)) : null),
  put: async (k, v) => void m.set(k, String(v)),
  delete: async (k) => void m.delete(k),
};
const from = (ip) => new Request("https://x/", { headers: { "cf-connecting-ip": ip } });
const now = Date.parse("2026-09-26T12:00:00Z");
const user = (i, made = "2026-09-25T10:00:0" + i) => ({ id: "u" + i, role: "user", created_date: made });

for (let i = 0; i < NETWORK_LIMIT; i++) assert(!(await noteAccount(kv, from("1.1.1.1"), user(i), now)).over, `account ${i + 1} on a network is fine`);
assert(await networkFull(kv, from("1.1.1.1"), now), "then sign-up on that network is refused");
assert((await noteAccount(kv, from("1.1.1.1"), user(9), now)).over, `account ${NETWORK_LIMIT + 1} (made some other way) is put on hold`);
assert(!(await noteAccount(kv, from("1.1.1.1"), user(0), now)).over, "the first five stay fine when they come back");
assert(!(await networkFull(kv, from("2.2.2.2"), now)), "another network isn't affected");
assert(!(await noteAccount(kv, from("3.3.3.3"), { id: "old", role: "user", created_date: "2026-01-01T00:00:00" }, now)).over && !m.has("net:3.3.3.3"), "accounts made before the limit started aren't counted");
assert(!(await networkFull(kv, from("1.1.1.1"), now + 31 * 86400000)), "after 30 days the network can make accounts again");

// The owner's network: once an admin uses it, it's never limited.
await noteAccount(kv, from("9.9.9.9"), { id: "boss", role: "admin" }, now);
for (let i = 0; i < NETWORK_LIMIT + 3; i++) await noteAccount(kv, from("9.9.9.9"), user(i + 20, "2026-09-25T11:00:" + String(10 + i)), now);
assert(!(await networkFull(kv, from("9.9.9.9"), now)) && !(await noteAccount(kv, from("9.9.9.9"), user(40), now)).over, "an admin's network is never limited");

// On hold = blocked, and Unblock in Monitor lets them in.
await applyGrant(kv, "u9", { networkLimit: true });
assert(blockedBy({ id: "u9" }, JSON.parse(m.get("grant:u9"))), "an account on hold can't use the app");
assert(JSON.parse(m.get("net-held")).some((r) => r.userId === "u9"), "Monitor can list the account as on hold");
await applyGrant(kv, "u9", { banned: false, blockedUntil: null });
assert(!blockedBy({ id: "u9" }, JSON.parse(m.get("grant:u9"))), "Unblock / unban in Monitor lets it in");
assert(!JSON.parse(m.get("net-held")).some((r) => r.userId === "u9"), "and it comes off the on-hold list");

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
