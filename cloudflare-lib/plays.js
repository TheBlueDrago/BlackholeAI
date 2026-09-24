// Game play counts, kept in KV (one "plays" key: { <game>: { count, users: [ids] } }).
// Base44's get-game-html counted plays with a Base44 function, which used up the Base44
// integration allowance; this counts each signed-in player once per game, costing one
// KV write per new player. The Games page adds these to PublishedGame.plays (the
// count from before this moved).
const KEY = "plays";
const MAX_USERS = 5000;

export async function readPlays(kv) {
  try {
    return (await kv.get(KEY, "json")) || {};
  } catch {
    return {};
  }
}

export async function countPlay(kv, name, userId) {
  if (!kv || !name || !userId) return;
  const all = await readPlays(kv);
  const g = all[name] || { count: 0, users: [] };
  if (g.users.includes(userId)) return;
  g.count += 1;
  g.users = [...g.users, userId].slice(-MAX_USERS);
  all[name] = g;
  try {
    await kv.put(KEY, JSON.stringify(all));
  } catch {
    // KV daily write limit: skip counting rather than fail the game.
  }
}

// Plays Base44 counted before counting moved here (2026-09-23) are frozen: captured once from
// the PublishedGame rows into the "legacyplays" key. Owners can edit their own rows, so after
// that the rows' plays field is never trusted again: a made-up number can't lift a game up
// the "Top Games" list. `loadRows()` -> the rows (only called while there's no snapshot).
const LEGACY_KEY = "legacyplays";

export async function legacyPlays(kv, loadRows) {
  if (!kv) return {};
  try {
    const saved = await kv.get(LEGACY_KEY, "json");
    if (saved) return saved;
  } catch {
    return {};
  }
  if (!loadRows) return {};
  const rows = await loadRows().catch(() => null);
  if (!Array.isArray(rows)) return {}; // try again next time
  const snap = {};
  for (const r of rows) {
    const n = Math.trunc(Number(r && r.plays) || 0);
    if (r && r.name && n > 0) snap[r.name] = n;
  }
  try {
    await kv.put(LEGACY_KEY, JSON.stringify(snap));
  } catch {
    // KV write limit: use it for this answer, save it next time
  }
  return snap;
}

// Every game's plays: the frozen Base44 count plus the players counted here. -> { name: n }
export async function totalPlays(kv, loadRows) {
  const [counted, legacy] = await Promise.all([readPlays(kv), legacyPlays(kv, loadRows)]);
  const out = { ...legacy };
  for (const [name, g] of Object.entries(counted)) out[name] = (out[name] || 0) + ((g && g.count) || 0);
  return out;
}
