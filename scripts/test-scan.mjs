// Offline test for the Monitor safety flags (cloudflare-lib/scan.js).
// Run: node scripts/test-scan.mjs
// The "bad" sample pages are assembled from pieces at run time: written out whole,
// antivirus software flags this file as malware (which is rather the point of them).
const R = new URL("../", import.meta.url).pathname;
const { scanPage, flagRank } = await import(R + "cloudflare-lib/scan.js");
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const j = (...parts) => parts.join("");
const page = (body, head = "") => `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;
const S = j("<scr", "ipt");
const SE = j("</scr", "ipt>");
const EV = j("ev", "al(");

let r = scanPage(page(`<h1>My Bakery</h1><p>Fresh bread every day.</p><button onclick="go()">Order</button>${S}>function go(){alert('hi')}${SE}`));
assert(r.flag === "green" && r.malware === 0, "a normal bakery site is green");

r = scanPage(page("<canvas></canvas>", `${S} src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js">${SE}`));
assert(r.flag === "green", "scripts from well-known CDNs are fine");

r = scanPage(page(j("<p>Get free ro", "bux here!</p>")));
assert(r.flag === "yellow", "free-currency generator talk is yellow");

r = scanPage(page(`${S}>${EV}${j("at", "ob")}('eA=='))${SE}`));
assert(r.flag === "yellow" && r.malware > 0 && r.malware < 50, "running decoded text is yellow");

r = scanPage(page("<p>Welcome to Pokémon world</p>"));
assert(r.flag === "yellow" && r.reasons.some((x) => /copyright/.test(x)), "one brand mention is a possible-copyright yellow");

r = scanPage(page("<h1>Netflix</h1><p>Netflix movies. Netflix shows. Sign in to Netflix. Netflix originals. Netflix kids.</p>"));
assert(r.flag === "red" && r.reasons.some((x) => /copy of netflix/i.test(x)), "a page full of one brand is a red copyright copy");

r = scanPage(page(j('<form action="https://', "bad.invalid/x", '"><input type="pass', 'word" name="p"></form>')));
assert(r.flag === "red", "a form sending passwords to another site is red (phishing)");

r = scanPage(page(`${S} src="https://${j("coin", "hive")}.invalid/m.js">${SE}`));
assert(r.flag === "red", "a crypto miner is red");

r = scanPage(page(j("<p>x", "xx po", "rn ns", "fw</p>")));
assert(r.flag === "red" && r.reasons.some((x) => /kids/.test(x)), "adult content is red");

r = scanPage(
  page(
    `${S} src="https://odd.invalid/a.js">${SE}${S}>${EV}x);${EV}y);${EV}z)${SE}` +
      `${S}>window.location="https://other.invalid"${SE}<a href="https://x.invalid/${j("setup.", "exe")}">download</a>`
  )
);
assert(r.flag === "red" && r.malware >= 50, "many malware signs add up to 50%+ (red)");

assert(flagRank("red") < flagRank("yellow") && flagRank("yellow") < flagRank("green"), "red sorts before yellow before green");

// Publish-time blocking (published.js refuses pages whose scan has a `block` list).
r = scanPage(page("<h1>Netflix</h1><p>Netflix movies. Netflix shows. Sign in to Netflix. Netflix originals. Netflix kids.</p>"));
assert(r.block.length === 0, "a brand-heavy fan page is flagged red but not blocked at publish");
r = scanPage(page(j("<p>x", "xx po", "rn ns", "fw</p>")));
assert(r.block.some((x) => /adult/.test(x)), "adult content is blocked at publish");
r = scanPage(page(`${S} src="https://${j("coin", "hive")}.invalid/m.js">${SE}`));
assert(r.block.some((x) => /mining/.test(x)), "a crypto miner is blocked at publish");
r = scanPage(page(`<input id="n">${S}>function calc(){return ${EV}n.value)}${SE}`));
assert(r.block.length === 0, "a calculator using eval is not blocked");
r = scanPage(page(`<h1>My Bakery</h1><p>Fresh bread every day.</p>`));
assert(r.block.length === 0, "a normal page is not blocked");
