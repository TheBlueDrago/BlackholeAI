// Starter templates for the Website Designer. Picking one opens it in the designer
// (no AI call, so no credits), where the user edits it by chatting or by hand.
// Each is a complete single-file page: no external requests, works on phones.

const base = (title, css, body) =>
  `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.6}
img{max-width:100%;display:block}
a{color:inherit}
${css}
</style>
</head>
<body>
${body}
</body>
</html>`;

const portfolio = base(
  "Maya Chen — Photography",
  `:root{--bg:#faf8f5;--ink:#1c1917;--muted:#78716c;--accent:#b45309}
body{background:var(--bg);color:var(--ink)}
header{display:flex;justify-content:space-between;align-items:center;padding:24px 6vw;flex-wrap:wrap;gap:12px}
.logo{font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:14px}
nav a{margin-left:22px;text-decoration:none;color:var(--muted);font-size:14px}
nav a:hover{color:var(--ink)}
.hero{padding:10vh 6vw 8vh;max-width:900px}
.hero h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(36px,7vw,72px);line-height:1.05}
.hero p{margin-top:20px;color:var(--muted);font-size:18px;max-width:520px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;padding:0 6vw 10vh}
.shot{aspect-ratio:4/5;border-radius:6px;display:flex;align-items:flex-end;padding:16px;color:#fff;font-size:14px}
.s1{background:linear-gradient(160deg,#fcd34d,#b45309)}.s2{background:linear-gradient(160deg,#94a3b8,#1e293b)}
.s3{background:linear-gradient(160deg,#fda4af,#9f1239)}.s4{background:linear-gradient(160deg,#86efac,#166534)}
.s5{background:linear-gradient(160deg,#a5b4fc,#3730a3)}.s6{background:linear-gradient(160deg,#fdba74,#7c2d12)}
.about{display:grid;grid-template-columns:1fr 1fr;gap:6vw;padding:10vh 6vw;border-top:1px solid #e7e5e4}
.about h2{font-family:Georgia,serif;font-weight:400;font-size:36px}
.about p{color:var(--muted);margin-bottom:14px}
.btn{display:inline-block;margin-top:10px;background:var(--ink);color:var(--bg);padding:12px 22px;border-radius:999px;text-decoration:none;font-size:14px}
footer{padding:30px 6vw;color:var(--muted);font-size:13px;border-top:1px solid #e7e5e4}
@media(max-width:700px){.about{grid-template-columns:1fr}nav a{margin:0 16px 0 0}}`,
  `<header><div class="logo">Maya Chen</div><nav><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></nav></header>
<section class="hero"><h1>Quiet light, honest moments.</h1><p>Portrait and travel photographer based in Lisbon, working with people and brands who like things real.</p></section>
<section class="grid" id="work">
<div class="shot s1">Golden hour, Alfama</div><div class="shot s2">Harbour fog</div><div class="shot s3">Ana, studio</div>
<div class="shot s4">Sintra hills</div><div class="shot s5">Blue hour, Porto</div><div class="shot s6">Market day</div>
</section>
<section class="about" id="about"><h2>About</h2><div><p>I've spent ten years photographing weddings, portraits and small businesses across Europe. I keep sessions relaxed, use natural light, and deliver edited galleries within two weeks.</p><p id="contact">Booking sessions for spring — tell me what you have in mind.</p><a class="btn" href="mailto:hello@example.com">Get in touch</a></div></section>
<footer>© Maya Chen Photography</footer>`
);

const restaurant = base(
  "Olive & Ember — Menu",
  `:root{--bg:#14110f;--card:#1f1a17;--ink:#f5efe6;--muted:#a8a29e;--accent:#f59e0b}
body{background:var(--bg);color:var(--ink)}
.hero{min-height:62vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:60px 20px;background:radial-gradient(circle at 50% 30%,#7c2d12 0,#14110f 70%)}
.hero small{letter-spacing:.3em;text-transform:uppercase;color:var(--accent);font-size:12px}
.hero h1{font-family:Georgia,serif;font-size:clamp(40px,8vw,80px);font-weight:400;margin:10px 0}
.hero p{color:var(--muted);max-width:460px}
.tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:30px 16px 0;position:sticky;top:0;background:var(--bg);z-index:2}
.tabs a{padding:8px 16px;border:1px solid #44403c;border-radius:999px;text-decoration:none;font-size:14px;color:var(--muted)}
.tabs a:hover{color:var(--ink);border-color:var(--accent)}
.menu{max-width:760px;margin:0 auto;padding:20px 20px 60px}
.menu h2{font-family:Georgia,serif;font-weight:400;font-size:30px;margin:40px 0 14px;color:var(--accent)}
.item{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-bottom:1px dashed #3a332e}
.item b{font-weight:600}.item span{color:var(--muted);font-size:14px;display:block}
.price{color:var(--accent);font-weight:600;white-space:nowrap}
.info{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;max-width:760px;margin:0 auto 60px;padding:0 20px}
.info div{background:var(--card);border-radius:14px;padding:20px}
.info h3{font-size:13px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);margin-bottom:6px}
.info p{color:var(--muted);font-size:14px}`,
  `<section class="hero"><small>Wood-fired kitchen</small><h1>Olive &amp; Ember</h1><p>Seasonal Mediterranean plates cooked over open flame. Walk-ins welcome.</p></section>
<nav class="tabs"><a href="#starters">Starters</a><a href="#mains">Mains</a><a href="#desserts">Desserts</a><a href="#visit">Visit</a></nav>
<section class="menu">
<h2 id="starters">Starters</h2>
<div class="item"><div><b>Charred flatbread</b><span>Whipped feta, hot honey, za'atar</span></div><div class="price">$9</div></div>
<div class="item"><div><b>Grilled halloumi</b><span>Blood orange, mint, pistachio</span></div><div class="price">$12</div></div>
<div class="item"><div><b>Ember-roasted peppers</b><span>Garlic confit, sourdough</span></div><div class="price">$10</div></div>
<h2 id="mains">Mains</h2>
<div class="item"><div><b>Lamb skewers</b><span>Saffron rice, yogurt, sumac onions</span></div><div class="price">$24</div></div>
<div class="item"><div><b>Whole sea bream</b><span>Lemon, capers, wild greens</span></div><div class="price">$28</div></div>
<div class="item"><div><b>Smoked aubergine</b><span>Tahini, pomegranate, herbs (v)</span></div><div class="price">$19</div></div>
<h2 id="desserts">Desserts</h2>
<div class="item"><div><b>Olive oil cake</b><span>Citrus, crème fraîche</span></div><div class="price">$8</div></div>
<div class="item"><div><b>Burnt honey ice cream</b><span>Sesame brittle</span></div><div class="price">$7</div></div>
</section>
<section class="info" id="visit"><div><h3>Hours</h3><p>Tue–Sun · 5pm–11pm</p></div><div><h3>Find us</h3><p>12 Harbour Street</p></div><div><h3>Book</h3><p>(555) 014-2290</p></div></section>`
);

const landing = base(
  "Flowly — Focus, finally",
  `:root{--bg:#0b1020;--ink:#e6e9f5;--muted:#8b93b3;--a:#6366f1;--b:#22d3ee}
body{background:var(--bg);color:var(--ink)}
header{display:flex;justify-content:space-between;align-items:center;padding:20px 6vw}
.logo{font-weight:800;font-size:20px}.logo i{font-style:normal;background:linear-gradient(90deg,var(--a),var(--b));-webkit-background-clip:text;background-clip:text;color:transparent}
.cta{background:linear-gradient(90deg,var(--a),var(--b));color:#fff;border:0;padding:12px 22px;border-radius:12px;font-weight:600;text-decoration:none;display:inline-block}
.hero{text-align:center;padding:12vh 6vw 8vh;max-width:860px;margin:0 auto}
.pill{display:inline-block;border:1px solid #27304f;border-radius:999px;padding:6px 14px;font-size:13px;color:var(--muted)}
.hero h1{font-size:clamp(38px,7vw,68px);line-height:1.05;margin:22px 0;font-weight:800}
.hero p{color:var(--muted);font-size:18px;max-width:560px;margin:0 auto 30px}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;padding:4vh 6vw 10vh;max-width:1100px;margin:0 auto}
.f{background:#121933;border:1px solid #1f2847;border-radius:18px;padding:24px}
.f .ic{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--a),var(--b));margin-bottom:14px}
.f h3{margin-bottom:6px}.f p{color:var(--muted);font-size:15px}
.pricing{text-align:center;padding:0 6vw 12vh}
.plan{display:inline-block;background:#121933;border:1px solid var(--a);border-radius:22px;padding:34px 40px;margin-top:24px}
.plan .n{font-size:48px;font-weight:800}.plan .n small{font-size:16px;color:var(--muted);font-weight:400}
.plan ul{list-style:none;margin:16px 0 22px;color:var(--muted);text-align:left}
footer{text-align:center;color:var(--muted);font-size:13px;padding:30px}`,
  `<header><div class="logo">Flow<i>ly</i></div><a class="cta" href="#pricing">Get started</a></header>
<section class="hero"><span class="pill">New · Smart focus sessions</span><h1>Do your best work, without the noise.</h1><p>Flowly blocks distractions, plans your deep-work blocks and shows how your focus improves week by week.</p><a class="cta" href="#pricing">Start free for 14 days</a></section>
<section class="features">
<div class="f"><div class="ic"></div><h3>Focus sessions</h3><p>One click silences notifications and distracting sites for as long as you need.</p></div>
<div class="f"><div class="ic"></div><h3>Smart planning</h3><p>Flowly finds the hours you focus best and books them before meetings do.</p></div>
<div class="f"><div class="ic"></div><h3>Weekly insights</h3><p>See where your time went and what helped, in a two-minute report.</p></div>
</section>
<section class="pricing" id="pricing"><h2>Simple pricing</h2><div class="plan"><div class="n">$6<small>/month</small></div><ul><li>✓ Unlimited focus sessions</li><li>✓ Calendar sync</li><li>✓ Weekly insights</li></ul><a class="cta" href="#">Try it free</a></div></section>
<footer>© Flowly</footer>`
);

const links = base(
  "Jordan Lee — Links",
  `body{min-height:100vh;background:linear-gradient(160deg,#fde68a,#f472b6 50%,#818cf8);display:flex;justify-content:center;padding:60px 18px;color:#1f1b2e}
.card{width:100%;max-width:420px;text-align:center}
.avatar{width:96px;height:96px;border-radius:50%;margin:0 auto 14px;background:#1f1b2e;color:#fde68a;display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800;border:4px solid #fff}
h1{font-size:24px}.bio{margin:6px 0 26px;opacity:.8}
.link{display:block;background:rgba(255,255,255,.85);border-radius:16px;padding:16px;margin-bottom:12px;text-decoration:none;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.08);transition:transform .15s}
.link:hover{transform:translateY(-2px)}
.social{margin-top:24px;display:flex;gap:10px;justify-content:center}
.social a{width:42px;height:42px;border-radius:50%;background:#1f1b2e;color:#fff;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:14px;font-weight:700}`,
  `<main class="card"><div class="avatar">J</div><h1>Jordan Lee</h1><p class="bio">Musician · producer · making lo-fi beats every Friday</p>
<a class="link" href="#">🎧 New EP — "Late Trains"</a><a class="link" href="#">📺 Watch the studio sessions</a><a class="link" href="#">🎟️ Tour dates</a><a class="link" href="#">✉️ Booking &amp; collabs</a>
<div class="social"><a href="#">IG</a><a href="#">YT</a><a href="#">SP</a><a href="#">TT</a></div></main>`
);

export const SITE_TEMPLATES = [
  { id: "portfolio", title: "Portfolio", blurb: "Photographer or creative", html: portfolio },
  { id: "restaurant", title: "Restaurant menu", blurb: "Menu, hours and location", html: restaurant },
  { id: "landing", title: "Product landing", blurb: "Features and pricing", html: landing },
  { id: "links", title: "Link in bio", blurb: "All your links on one page", html: links },
];
