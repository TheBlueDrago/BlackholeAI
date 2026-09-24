// Checks a discount promo code. { code, productId?, claim? } -> { ok, code, pct, target, label }
// The Shop and Billing ask it to show the lower price. Base44's create-checkout asks it too,
// with the buyer's own sign-in and claim: true, and charges what it answers, so a browser
// can't set its own price. See cloudflare-lib/promos.js.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { checkDiscount } from "../../../../../cloudflare-lib/promos.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in to use a promo code." }, 401);
    // Guessing codes: a limited number of tries per hour.
    if (!(await allow(`promo-discount:${user.id}`, 30, 3600))) return json({ error: TOO_MANY }, 429);
    const body = await request.json().catch(() => ({}));
    const d = await checkDiscount(env.PUBLISHED_HTML, request, user, body.code, body.productId, { claim: body.claim === true });
    return json({ ok: true, ...d });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not check that promo code." }, 400);
  }
}
