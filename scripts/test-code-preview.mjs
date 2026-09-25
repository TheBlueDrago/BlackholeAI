// Offline test: which code blocks in a chat reply get a Preview button (src/lib/codePreview.js).
// Run: node scripts/test-code-preview.mjs
import { previewable } from "../src/lib/codePreview.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
assert(previewable("html", "<h1>Hello there</h1>"), "an HTML block can be previewed");
assert(previewable("svg", "<svg viewBox='0 0 10 10'></svg>") && previewable("xml", "<svg width='5'></svg>"), "SVG pictures too");
assert(!previewable("xml", "<note><to>x</to></note>"), "other XML isn't");
assert(!previewable("python", "print('<html>')") && !previewable("js", "document.body.innerHTML='<b>x</b>'"), "other languages aren't");
assert(previewable("", "<!DOCTYPE html><html><body>x</body></html>") && !previewable("", "just some text"), "unlabelled: only a whole page");
assert(!previewable("html", "<b></b>"), "nothing to show: no button");
