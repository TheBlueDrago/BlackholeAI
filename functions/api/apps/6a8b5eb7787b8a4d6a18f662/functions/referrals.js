// Refer-a-friend for the signed-in user (see cloudflare-lib/referrals.js).
// { action: "get" }                    -> { code, link, rewards, referrals, welcome }
// { action: "join", code }             -> count this (brand-new) account as referred
// { action: "claim", referredId, tier } -> take a referral's reward as that AI's credits
// { action: "claim-welcome", tier }    -> the new user takes their own welcome bonus
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser, entitlement, creditStatus } from "../../../../../cloudflare-lib/credits.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";
import { REWARDS, referralCode, referralLink, listReferrals, joinWithCode, claimReward, getWelcome, claimWelcome, networkId, publicReferrals } from "../../../../../cloudflare-lib/referrals.js";
import { accountBlocked, BLOCKED_MESSAGE } from "../../../../../cloudflare-lib/bans.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in." }, 401);
    const body = await request.json().catch(() => ({}));
    const credits = async () => creditStatus(kv, await entitlement(kv, request, user));
    // Joining and claiming hand out credits (which can be bought, so they're worth money):
    // a limited number of tries per hour.
    if (body.action && !(await allow(`referral:${user.id}`, 20, 3600))) return json({ error: TOO_MANY }, 429);
    if (body.action && (await accountBlocked(kv, user))) return json({ error: BLOCKED_MESSAGE }, 403);

    if (body.action === "join") {
      const r = await joinWithCode(kv, user, body.code, await networkId(request.headers.get("cf-connecting-ip")));
      return json(r, r.ok ? 200 : 400);
    }

    if (body.action === "claim") {
      const referrals = await claimReward(kv, request, user, String(body.referredId || ""), String(body.tier || ""));
      return json({ referrals: publicReferrals(referrals), credits: await credits() });
    }

    if (body.action === "claim-welcome") {
      const welcome = await claimWelcome(kv, request, user, String(body.tier || ""));
      return json({ welcome, credits: await credits() });
    }

    const code = await referralCode(kv, user.id);
    return json({
      code,
      link: referralLink(code),
      rewards: REWARDS,
      referrals: publicReferrals(await listReferrals(kv, user.id)),
      welcome: await getWelcome(kv, user.id),
    });
  } catch (err) {
    return json({ error: (err && err.message) || "Referral error" }, 400);
  }
}
