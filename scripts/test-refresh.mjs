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
assert(o.upgrade.id === "pro" && o.upgrade.price === 1 && o.upgrade.extra === 50 && !o.upgrade.salePrice, "Free, Blackhole AI: Pro for $1, 50 more now");
assert(o.refresh.at === oct1 && o.refresh.amount === 50, "Free, Blackhole AI: 50 come back on the 1st");

o = outOfCreditsOptions("galaxy5", { plan: "free" }, now);
assert(o.upgrade.id === "pro" && o.upgrade.extra === 50 && o.refresh === null, "Free has no Galaxy credits: upgrade only, nothing to wait for");

o = outOfCreditsOptions("space5", { plan: "pro", planSource: "paid" }, now);
assert(o.upgrade.id === "team" && o.upgrade.price === 5 && o.upgrade.extra === 50 && o.refresh.amount === 50, "Pro: Team for $5, or wait for 50");

o = outOfCreditsOptions("ai", { plan: "free", offer: { discountAvailable: true, discountPct: 30 } }, now);
assert(o.upgrade.salePrice === "0.70", "new-member offer: Pro shown at $0.70");

o = outOfCreditsOptions("ai", { plan: "pro", planSource: "trial", planEndsAt: "2026-09-28T00:00:00Z" }, now);
assert(o.upgrade.id === "team" && o.refresh.amount === 50, "free Pro week ending before the 1st: Free's 50 come back");

o = outOfCreditsOptions("aiCode", { plan: "team" }, now);
assert(o.upgrade === null && o.refresh.amount === 100, "Team: nothing to upgrade to, just wait");

o = outOfCreditsOptions("space5", { plan: "enterprise", shared: true, seats: 4 }, now);
assert(o.upgrade === null && o.refresh.amount === 100, "Enterprise: the pool refills 25 Space per seat");

o = outOfCreditsOptions("ai", { plan: "free" }, now);
assert(o.pack && o.pack.id === "credits-ai" && o.pack.credits === 50 && o.pack.price === 1, "a one-time pack of 50 Blackhole AI credits for $1");
o = outOfCreditsOptions("space5", { plan: "team" }, now);
assert(o.upgrade === null && o.pack.id === "credits-space" && o.pack.credits === 25, "Team, nothing to upgrade to: can still buy a Space pack");
