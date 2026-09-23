// Play counts recorded in KV since plays moved off Base44 (cloudflare-lib/plays.js).
// -> { plays: { <game>: count } }. The Games page adds these to PublishedGame.plays.
import { json } from "../../../../../cloudflare-lib/published.js";
import { readPlays } from "../../../../../cloudflare-lib/plays.js";

export async function onRequest(context) {
  const all = await readPlays(context.env.PUBLISHED_HTML);
  const plays = {};
  for (const [name, g] of Object.entries(all)) plays[name] = (g && g.count) || 0;
  return json({ plays });
}
