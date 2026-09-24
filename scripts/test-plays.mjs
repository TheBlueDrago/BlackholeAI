// Offline test for game play counts (cloudflare-lib/plays.js, functions/.../game-plays.js):
// Base44's old counts are frozen once, counting since then is the server's, and an owner
// editing the plays field on their own game's record can't move it up the lists.
// Run: node scripts/test-plays.mjs
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const R = (p) => new URL("../" + p, import.meta.url).href;
const { countPlay, totalPlays, legacyPlays } = await import(R("cloudflare-lib/plays.js"));
const store = new Map();
const kv = {
  get: async (k, t) => (store.has(k) ? (t === "json" ? JSON.parse(store.get(k)) : store.get(k)) : null),
  put: async (k, v) => store.set(k, String(v)),
};
const rows = [{ name: "old-hit", plays: 120 }, { name: "quiet", plays: 0 }, { name: "new-one" }];
let loads = 0;
const load = async () => {
  loads++;
  return rows.map((r) => ({ ...r }));
};

let t = await totalPlays(kv, load);
assert(t["old-hit"] === 120 && !t.quiet && loads === 1 && store.has("legacyplays"), "Base44's old counts are captured once");
await countPlay(kv, "old-hit", "p1");
await countPlay(kv, "new-one", "p1");
await countPlay(kv, "new-one", "p2");
await countPlay(kv, "new-one", "p2");
t = await totalPlays(kv, load);
assert(t["old-hit"] === 121 && t["new-one"] === 2 && loads === 1, "players counted since add on, once per player, without reloading the records");

rows[2].plays = 1000000; // the owner edits their own record
t = await totalPlays(kv, load);
assert(t["new-one"] === 2, "a made-up plays number on a record changes nothing");

const empty = new Map();
const kv2 = { get: async (k, t2) => (empty.has(k) ? (t2 === "json" ? JSON.parse(empty.get(k)) : empty.get(k)) : null), put: async (k, v) => empty.set(k, String(v)) };
assert(Object.keys(await legacyPlays(kv2, async () => { throw new Error("down"); })).length === 0 && !empty.has("legacyplays"), "if the records can't be read, nothing is frozen yet (it tries again)");

// The endpoint the Games page and Arcade use.
globalThis.fetch = async (url) => (String(url).includes("/entities/PublishedGame") ? new Response(JSON.stringify(rows)) : new Response("{}"));
const { onRequest } = await import(R("functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/game-plays.js"));
const res = await onRequest({ request: new Request("https://x/"), env: { PUBLISHED_HTML: kv } });
const data = await res.json();
assert(data.totals["old-hit"] === 121 && data.totals["new-one"] === 2 && data.plays["new-one"] === 2, "game-plays gives the totals to show and rank by");

// Built-in games can't be replaced by a published game with the same name.
{
  const { readFileSync } = await import("node:fs");
  const { badName, BUILT_IN_GAME_NAMES } = await import(R("cloudflare-lib/published.js"));
  const shipped = ["src/lib/veckShooterGame.js", "src/lib/pulseJumpGame.js"].map((f) => (readFileSync(new URL("../" + f, import.meta.url), "utf8").match(/_META = \{ name: "([^"]+)"/) || [])[1]);
  const list = readFileSync(new URL("../src/lib/builtInGames.js", import.meta.url), "utf8");
  const metas = (list.match(/\.\.\.[A-Z_]+_META/g) || []).length;
  assert(metas === shipped.length && shipped.every((n) => BUILT_IN_GAME_NAMES.includes(n)), `the server knows every built-in game's name (${shipped.join(", ")})`);
  assert(BUILT_IN_GAME_NAMES.every((n) => badName("game", n)), "and nobody can publish a game with one of them");
  assert(badName("game", "games") && !badName("game", "my-veck-game"), "'games' is reserved; names merely containing a built-in's are fine");
}

// Taken-down games are left out of the lists, even if the owner clears the hidden flag.
{
  const { setBlocked, syncTakenDown, readTakenDown } = await import(R("cloudflare-lib/reports.js"));
  globalThis.fetch = async (url) => (String(url).includes("/entities/PublishedGame") ? new Response(JSON.stringify([{ id: "g1", name: "scam-game", created_by_id: "x" }])) : new Response("{}"));
  const kv3store = new Map();
  const kv3 = {
    get: async (k, t) => (kv3store.has(k) ? (t === "json" ? JSON.parse(kv3store.get(k)) : kv3store.get(k)) : null),
    put: async (k, v) => kv3store.set(k, String(v)),
    delete: async (k) => kv3store.delete(k),
  };
  await setBlocked(kv3, new Request("https://x/"), "game", "scam-game", true);
  const { onRequest } = await import(R("functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/game-plays.js"));
  let data = await (await onRequest({ request: new Request("https://x/"), env: { PUBLISHED_HTML: kv3 } })).json();
  assert((data.takenDown || []).includes("scam-game"), "a taken-down game is in the list the game pages leave out");
  const td = await import(R("functions/api/apps/6a8b5eb7787b8a4d6a18f662/functions/taken-down.js"));
  const both = await (await td.onRequest({ request: new Request("https://x/"), env: { PUBLISHED_HTML: kv3 } })).json();
  assert(both.game.includes("scam-game") && Array.isArray(both.site), "taken-down gives the list to the Blackhole Browser too");
  await setBlocked(kv3, new Request("https://x/"), "game", "scam-game", false);
  data = await (await onRequest({ request: new Request("https://x/"), env: { PUBLISHED_HTML: kv3 } })).json();
  assert(!(data.takenDown || []).includes("scam-game"), "and back in the lists when an admin restores it");
  await syncTakenDown(kv3, [{ kind: "game", name: "older-scam" }, { kind: "site", name: "old-site" }]);
  const t = await readTakenDown(kv3);
  assert(t.game.includes("older-scam") && t.site.includes("old-site"), "pages taken down before the list existed are added when Monitor lists them");
}
