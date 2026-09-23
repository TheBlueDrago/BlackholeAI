// Replaces Base44's team-remove (see cloudflare-lib/teams.js). { emails } -> { memberEmails }
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { removeMembers } from "../../../../../cloudflare-lib/teams.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Sign in required." }, 401);
    if (!(await allow(`team:${user.id}`, 30, 3600))) return json({ error: TOO_MANY }, 429);
    const body = await request.json().catch(() => ({}));
    const team = await removeMembers(env.PUBLISHED_HTML, user, body.emails);
    return json({ memberEmails: team.memberEmails });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not remove member." }, 400);
  }
}
