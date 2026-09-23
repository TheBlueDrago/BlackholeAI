// Replaces Base44's my-team (see cloudflare-lib/teams.js for why). -> { team | null }
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser, basePlanOf, entitlement, creditStatus } from "../../../../../cloudflare-lib/credits.js";
import { myTeam } from "../../../../../cloudflare-lib/teams.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const user = await currentUser(request);
    if (!user) return json({ team: null }, 401);
    const base = await basePlanOf(kv, request, user);
    const status = await creditStatus(kv, await entitlement(kv, request, user));
    return json({ team: await myTeam(kv, user, base, status.tiers.aiCode.used) });
  } catch (err) {
    return json({ team: null, error: String((err && err.message) || err) }, 500);
  }
}
