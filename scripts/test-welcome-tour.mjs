// Offline test for who gets the welcome tour (src/lib/welcomeTour.js).
// Run: node scripts/test-welcome-tour.mjs
import { shouldOfferTour, markTourSeen } from "../src/lib/welcomeTour.js";

let failed = 0;
const assert = (c, m) => {
  console.log((c ? "ok " : "FAIL ") + m);
  if (!c) failed++;
};
const mem = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};
const now = Date.parse("2026-09-25T12:00:00Z");
const store = mem();
const fresh = { id: "new1", created_date: "2026-09-25T10:00:00" };
assert(shouldOfferTour(fresh, now, store), "a brand-new account is offered the tour");
assert(!shouldOfferTour({ id: "old", created_date: "2026-09-01T10:00:00" }, now, store), "an account that's been around is not");
assert(!shouldOfferTour(null, now, store) && !shouldOfferTour({ id: "x" }, now, store), "no account or no date: no tour");
markTourSeen("new1", store);
assert(!shouldOfferTour(fresh, now, store), "once answered (tour or explore myself), it doesn't come back");
assert(!shouldOfferTour(fresh, now, { getItem: () => { throw new Error("blocked"); } }), "blocked storage: no tour rather than one every visit");

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
