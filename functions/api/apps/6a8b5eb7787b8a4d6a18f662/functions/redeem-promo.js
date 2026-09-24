// Replaces Base44's redeem-promo. { code } -> { ok, code, aiModel, credits }
// See cloudflare-lib/promos.js.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { redeemPromo } from "../../../../../cloudflare-lib/promos.js";
import { allow, hits, bump, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";

// Wrong codes allowed per network per hour, across all its accounts (so one person with many
// accounts can't keep guessing). Only wrong ones count: a class all typing the code their
// teacher gave them is fine.
const MISSES_PER_NETWORK = 30;

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in to redeem a promo code." }, 401);
    // Guessing codes: a few tries per hour.
    if (!(await allow(`promo:${user.id}`, 10, 3600))) return json({ error: TOO_MANY }, 429);
    const miss = `promo-miss:${request.headers.get("cf-connecting-ip") || "unknown"}`;
    if ((await hits(miss, 3600)) >= MISSES_PER_NETWORK) return json({ error: TOO_MANY }, 429);
    const body = await request.json().catch(() => ({}));
    try {
      return json({ ok: true, ...(await redeemPromo(env.PUBLISHED_HTML, request, user, body.code)) });
    } catch (err) {
      await bump(miss, 3600);
      throw err;
    }
  } catch (err) {
    return json({ error: (err && err.message) || "Something went wrong redeeming your code." }, 400);
  }
}
