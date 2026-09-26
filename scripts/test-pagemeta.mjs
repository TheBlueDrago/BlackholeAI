// Offline test for the public pages' link previews (cloudflare-lib/pagemeta.js).
// Run: node scripts/test-pagemeta.mjs
const R = new URL("../", import.meta.url).pathname;
const { withMeta, PAGES } = await import(R + "cloudflare-lib/pagemeta.js");
const fs = await import("fs");
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const out = withMeta(index, PAGES.enterprise);
assert(out.includes("<title>Enterprise · Nebulux AI</title>"), "the tab title names the page");
assert(out.includes('property="og:title" content="Enterprise · Nebulux AI"'), "the preview title names the page");
assert(out.includes('property="og:url" content="https://nebuluxai.com/enterprise"'), "the preview points at the page's own address");
assert(out.includes('name="description" content="Nebulux AI for your whole organization'), "the description is the page's own");
assert(!/\$\d+ ?(a|per) seat/.test(PAGES.enterprise.description + PAGES.pricing.description), "the Enterprise price isn't shown in any preview");
for (const [k, p] of Object.entries(PAGES)) assert(p.path === "/" + k && p.title && p.description.length > 40, `${k}: has a title, description and address`);

// Pages built by a function carry the app's security headers (same as public/_headers).
{
  const { servePage, PAGES: P, APP_HEADERS } = await import(R + "cloudflare-lib/pagemeta.js");
  const env = { ASSETS: { fetch: async () => new Response(index, { headers: { "content-type": "text/html", "content-length": "5" } }) } };
  const res = await servePage(P.safety)({ request: new Request("https://nebuluxai.com/safety"), env });
  assert(res.headers.get("x-frame-options") === "SAMEORIGIN" && res.headers.get("x-content-type-options") === "nosniff", "served pages get the security headers");
  assert(!res.headers.get("content-length"), "the stale length header is dropped");
  const file = (await import("node:fs")).readFileSync(new URL("../public/_headers", import.meta.url), "utf8");
  assert(Object.entries(APP_HEADERS).every(([k, v]) => file.toLowerCase().includes(`${k}: ${v}`.toLowerCase())), "the headers match public/_headers");
}
