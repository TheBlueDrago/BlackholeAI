// Offline test: published websites get a real name (src/lib/siteNaming.js).
// Run: node scripts/test-site-naming.mjs
import { isPlaceholderName, displayName, withTitle } from "../src/lib/siteNaming.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
assert(["", "my-site", "your-site", "My-Site", "site2", "my-game", "untitled", "website"].every(isPlaceholderName), "placeholder names must be changed before publishing");
assert(!["joes-bakery", "nova", "creator", "sam-portfolio"].some(isPlaceholderName), "real names are fine");
assert(displayName("joes-bakery") === "Joes Bakery" && displayName("nova") === "Nova", "the name reads nicely as a title");
assert(withTitle("<html><head><title>Luna Cafe</title></head></html>", "luna") === "<html><head><title>Luna Cafe</title></head></html>", "a page's own real title is kept");
assert(withTitle("<html><head><title>Document</title></head></html>", "joes-bakery").includes("<title>Joes Bakery</title>"), "a generic title is replaced with the site's name");
assert(withTitle("<html><head><meta charset=utf-8></head><body>x</body></html>", "nova").includes("<head>\n<title>Nova</title>"), "no title: one is added");
assert(withTitle("<p>hi</p>", "a-b") === "<title>A B</title>\n<p>hi</p>", "even with no head");
