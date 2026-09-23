// Replaces Base44's team-leave (see cloudflare-lib/teams.js). -> { ok, role, message }
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { leave } from "../../../../../cloudflare-lib/teams.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Sign in required." }, 401);
    return json(await leave(env.PUBLISHED_HTML, user));
  } catch (err) {
    return json({ error: (err && err.message) || "Could not leave the team." }, 400);
  }
}
