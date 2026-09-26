// Offline test for game link previews (cloudflare-lib/playmeta.js).
// Run: node scripts/test-playmeta.mjs
const R = new URL("../", import.meta.url).pathname;
const { withGameMeta } = await import(R + "cloudflare-lib/playmeta.js");
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const index = `<head><meta name="description" content="Chat with AI." /><meta property="og:title" content="Nebulux AI" /><meta property="og:description" content="Chat with AI." /><title>Nebulux AI</title></head>`;

let out = withGameMeta(index, { title: "Space Race", genre: "racing" });
assert(out.includes("<title>Space Race · Nebulux AI</title>"), "the tab title names the game");
assert(out.includes('property="og:title" content="Play Space Race"'), "the preview title names the game");
assert(out.includes('property="og:description" content="A racing game made with Nebulux AI.'), "the preview says what it is");
assert(out.includes('name="description" content="A racing game'), "the search description is updated too");

out = withGameMeta(index, { title: `"><script>alert(1)</script>` });
assert(!out.includes("<script>"), "a game title can't add HTML to the page");

assert(withGameMeta(index, { title: "" }) === index, "no title leaves the page as it was");
