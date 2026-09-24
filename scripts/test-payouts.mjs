// Offline test for the creator payout checks (src/lib/payoutChecks.js). Run: node scripts/test-payouts.mjs
const R = new URL("../", import.meta.url).pathname;
const { payoutWarnings, payoutSummary } = await import(R + "src/lib/payoutChecks.js");
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const now = Date.parse("2026-10-30T12:00:00Z");
const old = "2026-10-01T12:00:00Z";
const sale = (o) => ({ siteName: "shop", creatorEmail: "maker@x.com", buyerEmail: "b@y.com", gross: "10.00", creatorPayout: "9.50", paidAt: old, ...o });

assert(payoutWarnings(sale(), [sale()], now).length === 0, "an old, normal sale is fine to pay");
assert(payoutWarnings(sale({ buyerEmail: "Maker@X.com" }), [], now).some((w) => w.includes("owner")), "buying from your own site is flagged");
assert(payoutWarnings(sale({ paidAt: "2026-10-25T12:00:00Z" }), [], now).some((w) => w.includes("14 days")), "a sale from this week is held");
const burst = [sale({ paidAt: "2026-10-01T10:00:00Z" }), sale({ paidAt: "2026-10-01T11:00:00Z" }), sale({ paidAt: "2026-10-01T12:00:00Z" })];
assert(payoutWarnings(burst[0], burst, now).some((w) => w.includes("3 orders")), "many orders from one buyer in a day are flagged");
assert(payoutWarnings(sale({ gross: "250.00" }), [], now).some((w) => w.includes("large")), "a big order is flagged");
const sum = payoutSummary([sale(), sale({ buyerEmail: "maker@x.com" })], now);
assert(sum.length === 1 && sum[0].ready === 9.5 && sum[0].hold === 9.5, "the summary splits ready and held amounts per creator");

// Sales from a site an admin took down are held, whatever else is true.
{
  const down = new Set(["scamshop"]);
  assert(payoutWarnings(sale({ siteName: "scamshop" }), [], now, down).includes("The site was taken down"), "a taken-down site's sale is held");
  assert(payoutWarnings(sale(), [sale()], now, down).length === 0, "other sites' sales aren't affected");
  const sum = payoutSummary([sale({ siteName: "scamshop", creatorPayout: "9.00" })], now, down);
  assert(sum[0].hold === 9 && sum[0].ready === 0, "and its payout counts as held, not ready");
}
