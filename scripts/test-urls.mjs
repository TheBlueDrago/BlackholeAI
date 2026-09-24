// Offline test for the app's address helpers (src/lib/blackholeDomain.js): what the browser
// view will open, which site addresses are built, and which maker names are shown.
// Run: node scripts/test-urls.mjs
const R = new URL("../", import.meta.url).pathname;
const { safeWebUrl, siteUrl, makerName } = await import(R + "src/lib/blackholeDomain.js");
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "  javascript:alert(1)", "java\tscript:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", "file:///etc/passwd", "blob:https://x/1", "", null, "not a url", "//evil.com"]) {
  assert(safeWebUrl(bad) === "", `browser view refuses ${JSON.stringify(bad)}`);
}
assert(safeWebUrl("https://example.com/a?b=1") === "https://example.com/a?b=1", "https addresses open");
assert(safeWebUrl(" http://example.com ") === "http://example.com/", "http addresses open, trimmed");
for (const bad of ["evil.com#", "a/b", "x?y", "-x", "x-", "a..b", "", "UPPER spaces"]) assert(siteUrl(bad) === "", `no site address for ${JSON.stringify(bad)}`);
assert(siteUrl("My-Site-2") === "https://my-site-2.blackhole-ai-tech.com", "site names are lower-cased into their address");
assert(makerName("  Maya ") === "Maya" && makerName("BLACKHOLE") === "" && makerName("x@y.z") === "", "maker names");
