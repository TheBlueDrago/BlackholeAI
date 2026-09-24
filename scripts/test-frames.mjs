// Offline guard for how the app shows pages people make: every <iframe> in src/ is sandboxed,
// a frame showing HTML from the app's own origin (srcDoc) can never also get
// allow-same-origin (that pair would let a page's script reach the signed-in account), and
// chat replies are never rendered as raw HTML.
// Run: node scripts/test-frames.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const R = new URL("../", import.meta.url).pathname;
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(f)) files.push(p);
  }
})(join(R, "src"));

const { PREVIEW_SANDBOX } = await import(R + "src/lib/previewShim.js");
assert(!PREVIEW_SANDBOX.includes("allow-same-origin"), "previews can't reach the app's origin");
assert(!PREVIEW_SANDBOX.includes("allow-top-navigation"), "previews can't move the app's tab to another page");

// Frames allowed to pair scripts with allow-same-origin: they only ever load another
// website's address (checked by siteUrl / safeWebUrl), never HTML on the app's origin.
const OTHER_ORIGIN_FRAMES = {
  "src/components/browser/BrowserSiteFrame.jsx": "siteUrl(",
  "src/components/browser/BrowserWebFrame.jsx": "safeWebUrl(",
};

// The sandbox value a frame uses: a string literal, PREVIEW_SANDBOX, or a constant in the file.
function sandboxOf(tag, src) {
  const lit = tag.match(/sandbox=(?:"([^"]*)"|\{\s*"([^"]*)"\s*\})/);
  if (lit) return lit[1] ?? lit[2];
  const ref = tag.match(/sandbox=\{\s*([A-Z_]+)\s*\}/);
  if (!ref) return null;
  if (ref[1] === "PREVIEW_SANDBOX") return PREVIEW_SANDBOX;
  const def = src.match(new RegExp(`const ${ref[1]}\\s*=\\s*"([^"]*)"`));
  return def ? def[1] : null;
}

let frames = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const rel = relative(R, file);
  for (const m of src.matchAll(/<iframe\b[\s\S]*?\/?>/g)) {
    frames++;
    const tag = m[0];
    const line = src.slice(0, m.index).split("\n").length;
    const where = `${rel}:${line}`;
    const sandbox = sandboxOf(tag, src);
    assert(sandbox != null, `${where} frame is sandboxed`);
    if (sandbox == null) continue;
    assert(!/allow-top-navigation/.test(sandbox), `${where} frame can't move the app's tab`);
    if (sandbox.includes("allow-same-origin") && sandbox.includes("allow-scripts")) {
      const guard = OTHER_ORIGIN_FRAMES[rel];
      assert(!!guard && src.includes(guard) && !/srcDoc/.test(tag), `${where} scripts + same-origin only for a checked outside address`);
    }
  }
  assert(!/rehype-raw|rehypeRaw|allowDangerousHtml/.test(src), `${rel} doesn't turn raw HTML on in markdown`);
  if (/dangerouslySetInnerHTML/.test(src)) {
    // Only the chart styles (built from the app's own colour config) may set raw HTML.
    assert(rel === "src/components/ui/chart.jsx", `${rel} doesn't set raw HTML`);
  }
}
assert(frames >= 10, `found the app's frames (${frames})`);

const pkg = JSON.parse(readFileSync(join(R, "package.json"), "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
assert(!deps["rehype-raw"], "rehype-raw isn't installed");
