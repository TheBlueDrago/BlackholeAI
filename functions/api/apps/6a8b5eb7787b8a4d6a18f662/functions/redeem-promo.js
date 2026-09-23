// Replaces Base44's redeem-promo. { code } -> { ok, code, aiModel, credits }
// See cloudflare-lib/promos.js.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { redeemPromo } from "../../../../../cloudflare-lib/promos.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in to redeem a promo code." }, 401);
    // Guessing codes: a few tries per hour.
    if (!(await allow(`promo:${user.id}`, 10, 3600))) return json({ error: TOO_MANY }, 429);
    const body = await request.json().catch(() => ({}));
    return json({ ok: true, ...(await redeemPromo(env.PUBLISHED_HTML, request, user, body.code)) });
  } catch (err) {
    return json({ error: (err && err.message) || "Something went wrong redeeming your code." }, 400);
  }
}
