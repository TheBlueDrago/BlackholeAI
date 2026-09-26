// Offline guard for the service worker (public/sw.js): it may only ever serve the app's own
// page for app screens and the app's own code files. Sign-in, data, AI and payments (/api),
// published sites and the server-built public pages must always go to the network.
// Run: node scripts/test-sw.mjs
import { readFileSync } from "node:fs";

let failed = 0;
const assert = (c, m) => {
  console.log((c ? "ok " : "FAIL ") + m);
  if (!c) failed++;
};

const src = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const headers = readFileSync(new URL("../public/_headers", import.meta.url), "utf8");

// Run the worker's code with a fake `self` and catch its fetch handler.
const listeners = {};
const fakeSelf = { addEventListener: (t, f) => (listeners[t] = f), location: { origin: "https://nebuluxai.com" }, clients: { claim() {} }, skipWaiting() {} };
const fakeCache = { match: async () => null, put: async () => {}, keys: async () => [], delete: async () => true };
const fakeCaches = { open: async () => fakeCache, keys: async () => [], delete: async () => true };
const fakeFetch = async () => ({ ok: false, headers: { get: () => "" } });
new Function("self", "caches", "fetch", src)(fakeSelf, fakeCaches, fakeFetch);
const handled = (path, { method = "GET", mode = "navigate", destination = "document", origin = "https://nebuluxai.com" } = {}) => {
  let responded = false;
  listeners.fetch({ request: { method, url: origin + path, mode, destination }, respondWith: (p) => { responded = true; Promise.resolve(p).catch(() => {}); }, waitUntil: (p) => Promise.resolve(p).catch(() => {}) });
  return responded;
};

for (const p of ["/", "/chat", "/chat/designer/build", "/login", "/register", "/plans", "/ThankYou"]) assert(handled(p), `the app screen ${p} opens from the device`);
assert(handled("/assets/index-abc123.js", { mode: "no-cors", destination: "script" }), "the app's code files come from the device");
for (const p of ["/api/apps/x/entities/User/me", "/api/apps/x/functions/create-checkout", "/published/site/nova", "/guides", "/guides/resume-website", "/play/pulse", "/templates", "/pricing", "/sitemap.xml", "/sw.js", "/chatty"])
  assert(!handled(p) && !handled(p, { mode: "cors", destination: "" }), `${p} always goes to the network`);
assert(!handled("/chat", { method: "POST" }), "only GETs are touched");
assert(!handled("/chat", { destination: "iframe" }), "pages inside frames (previews) are never the app page");
assert(!handled("/", { origin: "https://nova.nebuluxai.com" }) && !handled("/assets/x.js", { origin: "https://evil.example", mode: "no-cors", destination: "script" }), "other addresses are never touched");
assert(/isCode\(r\)/.test(src) && /text\\\/html/.test(src), "a missing code file (served as a page) is never saved as code");
assert(/import\.meta\.env\.PROD/.test(main) && main.includes("register('/sw.js'"), "it's switched on for the live site only");
assert(/\/sw\.js\s*\n\s*Cache-Control: no-cache/.test(headers), "fixes to it reach everyone at once (never cached)");

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
