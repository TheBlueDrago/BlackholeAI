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
