// Checks a discount promo code. { code, productId?, claim? } -> { ok, code, pct, target, label }
// The Shop and Billing ask it to show the lower price. Base44's create-checkout asks it too,
// with the buyer's own sign-in and claim: true, and charges what it answers, so a browser
// can't set its own price. See cloudflare-lib/promos.js.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { checkDiscount } from "../../../../../cloudflare-lib/promos.js";
import { allow, hits, bump, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";

// Wrong codes tried per network per hour, across all its accounts, so one person with many
// accounts can't keep guessing. Checkout's own claim comes from Base44's servers (one shared
// network for every buyer), so claims are counted apart with a much higher cap: a browser
// sending claim: true to dodge the Shop's cap still hits that one.
const MISSES_PER_NETWORK = 30;
const CLAIM_MISSES_PER_NETWORK = 300;

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in to use a promo code." }, 401);
    // Guessing codes: a limited number of tries per hour.
    if (!(await allow(`promo-discount:${user.id}`, 30, 3600))) return json({ error: TOO_MANY }, 429);
    const body = await request.json().catch(() => ({}));
    const claim = body.claim === true;
    const miss = `promo-${claim ? "claim-" : ""}miss:${request.headers.get("cf-connecting-ip") || "unknown"}`;
    if ((await hits(miss, 3600)) >= (claim ? CLAIM_MISSES_PER_NETWORK : MISSES_PER_NETWORK)) return json({ error: TOO_MANY }, 429);
    let d;
    try {
      d = await checkDiscount(env.PUBLISHED_HTML, request, user, body.code, body.productId, { claim });
    } catch (err) {
      await bump(miss, 3600);
      throw err;
    }
    return json({ ok: true, ...d });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not check that promo code." }, 400);
  }
}
