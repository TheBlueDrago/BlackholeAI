// Play counts recorded in KV since plays moved off Base44 (cloudflare-lib/plays.js).
// -> { plays: { <game>: count } }. The Games page adds these to PublishedGame.plays.
// `totals` is the number to show and rank by: Base44's frozen count plus these (see
// totalPlays); the games' own plays field isn't trusted any more.
import { json, base44 } from "../../../../../cloudflare-lib/published.js";
import { readPlays, totalPlays } from "../../../../../cloudflare-lib/plays.js";

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  const all = await readPlays(kv);
  const plays = {};
  for (const [name, g] of Object.entries(all)) plays[name] = (g && g.count) || 0;
  const totals = await totalPlays(kv, () => base44(request, "GET", "entities/PublishedGame?limit=1000"));
  return json({ plays, totals });
}
