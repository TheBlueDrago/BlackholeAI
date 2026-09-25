// Offline test for the out-of-credits card's choices (src/lib/creditRefresh.js): which plan
// to upgrade to and for how much, and when the monthly credits come back.
// Run: node scripts/test-refresh.mjs
const R = new URL("../", import.meta.url).pathname;
const { outOfCreditsOptions, nextRefresh, waitText } = await import(R + "src/lib/creditRefresh.js");
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const now = Date.parse("2026-09-24T19:30:00Z");
const oct1 = Date.parse("2026-10-01T00:00:00Z");

assert(nextRefresh(now) === oct1, "credits come back at midnight UTC on the 1st");
assert(nextRefresh(Date.parse("2026-12-31T23:59:00Z")) === Date.parse("2027-01-01T00:00:00Z"), "December rolls over to January");
assert(waitText(oct1 - now) === "6 days 4 hours", "wait shown in days and hours");
assert(waitText(3 * 3600000 + 12 * 60000) === "3 hours 12 minutes" && waitText(5 * 60000) === "5 minutes" && waitText(1000) === "1 minute", "shorter waits");

let o = outOfCreditsOptions("ai", { plan: "free" }, now);
assert(o.upgrade.id === "pro" && o.upgrade.price === 2.99 && o.upgrade.extra === 50 && !o.upgrade.salePrice, "Free, Blackhole AI: Pro for $2.99, 50 more now");
assert(o.refresh.at === oct1 && o.refresh.amount === 50, "Free, Blackhole AI: 50 come back on the 1st");

o = outOfCreditsOptions("galaxy5", { plan: "free" }, now);
assert(o.upgrade.id === "pro" && o.upgrade.extra === 50 && o.refresh === null, "Free has no Galaxy credits: upgrade only, nothing to wait for");

o = outOfCreditsOptions("space5", { plan: "pro", planSource: "paid" }, now);
assert(o.upgrade.id === "team" && o.upgrade.price === 7.99 && o.upgrade.extra === 50 && o.refresh.amount === 50, "Pro: Team for $7.99, or wait for 50");

o = outOfCreditsOptions("ai", { plan: "free", offer: { discountAvailable: true, discountPct: 30 } }, now);
assert(o.upgrade.salePrice === "2.09", "new-member offer: Pro shown at $2.09 (30% off $2.99)");

o = outOfCreditsOptions("ai", { plan: "pro", planSource: "trial", planEndsAt: "2026-09-28T00:00:00Z" }, now);
assert(o.upgrade.id === "team" && o.refresh.amount === 50, "free Pro week ending before the 1st: Free's 50 come back");

o = outOfCreditsOptions("aiCode", { plan: "team" }, now);
assert(o.upgrade === null && o.refresh.amount === 100, "Team: nothing to upgrade to, just wait");

o = outOfCreditsOptions("space5", { plan: "enterprise", shared: true, seats: 4 }, now);
assert(o.upgrade === null && o.refresh.amount === 100, "Enterprise: the pool refills 25 Space per seat");

o = outOfCreditsOptions("ai", { plan: "free" }, now);
assert(o.pack && o.pack.id === "credits-ai-25" && o.pack.min === 5 && o.pack.max === 50 && Number(o.pack.from) === 0.5, "Blackhole AI packs of 5-50 credits, from $0.50, starting on 25");
o = outOfCreditsOptions("space5", { plan: "team" }, now);
assert(o.upgrade === null && o.pack.id === "credits-space-25", "Team, nothing to upgrade to: can still buy a Space pack");
o = outOfCreditsOptions("galaxy5", { plan: "free" }, now);
assert(o.pack.id === "credits-galaxy-25", "Free can buy Galaxy packs without a plan");
const P = await import(R + "cloudflare-lib/creditPacks.js");
const ids = Object.keys(P.CREDIT_PACKS);
assert(ids.length === 16 && ["ai", "code", "galaxy", "space"].every((a) => [5, 10, 25, 50].every((n) => P.CREDIT_PACKS[`credits-${a}-${n}`])), "every AI has packs of 5, 10, 25 and 50");
assert(Object.values(P.CREDIT_PACKS).every((p) => Number(p.price) >= 0.5), "no pack is under the $0.50 payment minimum");
const price = (id) => P.CREDIT_PACKS[id].price;
assert(["credits-ai-5", "credits-code-5", "credits-galaxy-5", "credits-space-5"].map(price).join() === "0.50,1.00,1.50,2.00", "5 credits: half the first $1/$2/$3/$4 (AI $0.50, Space $2)");
assert(price("credits-ai-10") === "0.75" && price("credits-code-10") === "1.50" && price("credits-galaxy-10") === "2.25" && price("credits-space-10") === "3.00", "10 credits: 1.5x the 5 pack (AI $0.75, Space $3)");
assert(price("credits-ai-25") === "1.50" && price("credits-space-25") === "6.00", "25 credits: 3x the 5-credit price (AI $1.50, Space $6)");
assert(price("credits-ai-50") === "2.25" && price("credits-space-50") === "9.00", "50 credits: 1.5x the 25 pack (Space $9, first $18)");
