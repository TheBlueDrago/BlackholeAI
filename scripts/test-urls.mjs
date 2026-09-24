// Offline test for the app's address helpers (src/lib/blackholeDomain.js): what the browser
// view will open, which site addresses are built, and which maker names are shown.
// Run: node scripts/test-urls.mjs
const R = new URL("../", import.meta.url).pathname;
const { safeWebUrl, siteUrl, makerName, notForKids } = await import(R + "src/lib/blackholeDomain.js");
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

const j = (...p) => p.join("");
for (const bad of [j("https://www.", "porn", "hub.com/"), j("https://", "xvideos", ".com"), "https://best-casino-online.example/", j("https://thepirate", "bay.org/")]) assert(notForKids(bad), `browser leaves out ${bad.replace(/https?:\/\/(www\.)?/, "").slice(0, 12)}…`);
for (const ok of ["https://en.wikipedia.org/wiki/Essex", "https://www.sussex.ac.uk/", "https://example.com/?q=porn", "not a url"]) assert(!notForKids(ok), `browser shows ${ok}`);

// The report form's reasons match the ones the server accepts (cloudflare-lib/reports.js).
{
  const { readFileSync } = await import("node:fs");
  const { REASONS } = await import(R + "cloudflare-lib/reports.js");
  const form = readFileSync(new URL("../src/pages/Report.jsx", import.meta.url), "utf8");
  const list = form.slice(form.indexOf("const REASONS = ["), form.indexOf("];", form.indexOf("const REASONS = [")));
  const keys = [...list.matchAll(/\["([a-z]+)", "/g)].map((m) => m[1]);
  assert(keys.length > 0 && keys.join() === Object.keys(REASONS).join(), `report reasons match the server (${keys.join(", ")})`);
}

// "Remember me" unticked: the saved sign-in is removed once the browser has been closed.
{
  const { markSessionOnly, forgetIfBrowserWasClosed, FLAG } = await import(R + "src/lib/sessionOnly.js");
  const mem = () => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
  };
  const doc = { cookie: "" };
  let s = mem();
  s.setItem("base44_access_token", "tok");
  markSessionOnly(true, s, doc);
  assert(s.getItem(FLAG) === "1" && doc.cookie.startsWith("bh_session=1") && /Secure/.test(doc.cookie), "unticking Remember me marks this browser session");
  assert(!forgetIfBrowserWasClosed(s, "other=1; bh_session=1") && s.getItem("base44_access_token") === "tok", "reloading or opening a new tab keeps you signed in");
  assert(forgetIfBrowserWasClosed(s, "other=1") && s.getItem("base44_access_token") === null && s.getItem("token") === null && s.getItem(FLAG) === null, "after the browser was closed, you're signed out");
  s = mem();
  s.setItem("base44_access_token", "tok");
  markSessionOnly(false, s, { cookie: "" });
  assert(!forgetIfBrowserWasClosed(s, "") && s.getItem("base44_access_token") === "tok", "with Remember me ticked you stay signed in");
  assert(!forgetIfBrowserWasClosed({ getItem: () => { throw new Error("blocked"); } }, ""), "blocked storage doesn't break start-up");
}
