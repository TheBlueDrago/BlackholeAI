// Offline test: a crash from an update going live reloads by itself, a few times at most
// (src/lib/updateReload.js). Run: node scripts/test-update-reload.mjs
import { isUpdateError, mayAutoReload } from "../src/lib/updateReload.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
assert(isUpdateError(new TypeError("Failed to fetch dynamically imported module: https://x/assets/Billing-Ck.js")), "Chrome's missing-file error");
assert(isUpdateError(new TypeError("Importing a module script failed.")) && isUpdateError("error loading dynamically imported module"), "Safari's and Firefox's");
assert(!isUpdateError(new TypeError("Cannot read properties of undefined (reading 'map')")) && !isUpdateError(null), "real bugs still show the normal crash screen");
const m = new Map();
const store = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
const t0 = 1_000_000;
const tries = [0, 10, 20, 30, 40].map((s) => mayAutoReload(t0 + s * 1000, store));
assert(tries.join() === "true,true,true,true,false", "at most 4 automatic reloads in 3 minutes (never an endless loop)");
assert(mayAutoReload(t0 + 4 * 60 * 1000, store), "later on it can reload again");
assert(!mayAutoReload(t0, { getItem: () => { throw new Error("x"); } }), "no storage: doesn't reload by itself");
