// Replaces Base44's team-invite (see cloudflare-lib/teams.js). { emails } -> { memberEmails }
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser, basePlanOf } from "../../../../../cloudflare-lib/credits.js";
import { invite } from "../../../../../cloudflare-lib/teams.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";
import { accountBlocked, BLOCKED_MESSAGE } from "../../../../../cloudflare-lib/bans.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Sign in required." }, 401);
    if (!(await allow(`team:${user.id}`, 30, 3600))) return json({ error: TOO_MANY }, 429);
    if (await accountBlocked(kv, user)) return json({ error: BLOCKED_MESSAGE }, 403);
    const body = await request.json().catch(() => ({}));
    const team = await invite(kv, user, await basePlanOf(kv, request, user), body.emails);
    return json({ memberEmails: team.memberEmails });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not add member." }, 400);
  }
}
