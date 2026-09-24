// Offline test for game draft autosave (game-draft function), with Base44 (fetch) and KV
// faked. Run: node scripts/test-drafts.mjs
const R = new URL("../", import.meta.url).pathname;
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const store = new Map();
const kv = { get: async (k, t) => (store.has(k) ? (t === "json" ? JSON.parse(store.get(k)) : store.get(k)) : null), put: async (k, v) => store.set(k, String(v)) };
let legacy = [];
const fetched = [];
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes("/entities/User/me")) return new Response(JSON.stringify({ id: "u1" }));
  if (u.includes("/entities/GameDraft")) return new Response(JSON.stringify(legacy));
  fetched.push(u);
  return new Response("<html>old draft</html>");
};
const mod = await import(R + "functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/game-draft.js");
const call = async (body) => (await mod.onRequestPost({ request: new Request("https://x/", { method: "POST", headers: { authorization: "Bearer t" }, body: JSON.stringify(body) }), env: { PUBLISHED_HTML: kv } })).json();

await call({ action: "save", gameName: "g".repeat(5000), title: "t".repeat(5000), genre: "x".repeat(500), html: "<p>hi</p>", userTurns: Array.from({ length: 80 }, () => "u".repeat(10000)), projectId: "p".repeat(500) });
const d = JSON.parse(store.get("draft:u1"));
assert(d.gameName.length === 100 && d.title.length === 200 && d.genre.length === 30 && d.projectId.length === 100, "name, title, genre and project id are capped");
assert(d.userTurns.length === 50 && d.userTurns.every((t) => t.length === 4000), "at most 50 saved requests of 4,000 characters");
const big = await call({ action: "save", html: "x".repeat(5 * 1024 * 1024 + 1) });
assert(big.error && /too large/.test(big.error), "a draft over 5 MB isn't saved");

store.clear();
legacy = [{ created_by_id: "u1", gameName: "old", htmlUrl: "http://169.254.169.254/latest" }];
let r = await call({ action: "load" });
assert(r.draft && r.draft.html === "" && !fetched.some((u) => u.includes("169.254")), "an old draft pointing at a non-https address isn't fetched");
legacy = [{ created_by_id: "u1", gameName: "old", htmlUrl: "https://files.example/old.html" }];
r = await call({ action: "load" });
assert(r.draft && r.draft.html.includes("old draft"), "an old https draft still loads");
