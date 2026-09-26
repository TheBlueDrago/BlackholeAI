// Offline test for the daily streak (src/lib/streak.js). Run: node scripts/test-streak.mjs
import { currentStreak, noteActivity, bestStreak } from "../src/lib/streak.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const m = new Map();
const store = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
assert(currentStreak("u1", "2026-09-25", store) === 0, "no messages yet: no streak");
assert(noteActivity("u1", "2026-09-25", store) === 1 && noteActivity("u1", "2026-09-25", store) === 1, "first day: 1, more messages that day don't add");
assert(noteActivity("u1", "2026-09-26", store) === 2 && noteActivity("u1", "2026-09-27", store) === 3, "each next day adds one");
assert(currentStreak("u1", "2026-09-28", store) === 3, "the next day it still shows until they skip it");
assert(currentStreak("u1", "2026-09-29", store) === 0, "a whole day missed: back to 0");
assert(noteActivity("u1", "2026-09-30", store) === 1 && bestStreak("u1", store) === 3, "starts again at 1, best kept");
assert(noteActivity("u1", "2026-10-01", store) === 2, "works across months");
assert(currentStreak("u2", "2026-10-01", store) === 0, "per account");
assert(noteActivity("u3", "2026-10-01", { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } }) === 1, "blocked storage doesn't break sending");
