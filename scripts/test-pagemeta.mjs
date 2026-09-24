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
assert(out.includes("<title>Enterprise · Blackhole AI</title>"), "the tab title names the page");
assert(out.includes('property="og:title" content="Enterprise · Blackhole AI"'), "the preview title names the page");
assert(out.includes('property="og:url" content="https://blackhole-ai-tech.com/enterprise"'), "the preview points at the page's own address");
assert(out.includes('name="description" content="Blackhole AI for your whole organization'), "the description is the page's own");
assert(!/\$\d+ ?(a|per) seat/.test(PAGES.enterprise.description + PAGES.pricing.description), "the Enterprise price isn't shown in any preview");
for (const [k, p] of Object.entries(PAGES)) assert(p.path === "/" + k && p.title && p.description.length > 40, `${k}: has a title, description and address`);
