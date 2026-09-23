// Admin-only credit controls for the Monitor page (see cloudflare-lib/credits.js and
// referrals.js). Body: { userId, action }
//   "get"    -> { credits, referrals, referredBy }
//   "adjust" -> { tier, delta }       add (or remove, if negative) credits for one AI
//   "revoke" -> { referredId }        take a referral back, removing its reward credits
import { json, base44 } from "../../../../../cloudflare-lib/published.js";
import { currentUser, entitlement, creditStatus, adjustBonus } from "../../../../../cloudflare-lib/credits.js";
import { listReferrals, revokeReferral } from "../../../../../cloudflare-lib/referrals.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const admin = await currentUser(request);
    if (!admin) return json({ error: "Please sign in." }, 401);
    if (admin.role !== "admin") return json({ error: "Admins only." }, 403);

    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || "");
    if (!userId) return json({ error: "userId required" }, 400);
    const target = await base44(request, "GET", `entities/User/${encodeURIComponent(userId)}`).catch(() => null);
    if (!target || !target.id) return json({ error: "User not found." }, 404);

    if (body.action === "adjust") {
      const delta = Math.trunc(Number(body.delta) || 0);
      if (!delta) return json({ error: "Enter a number of credits." }, 400);
      await adjustBonus(kv, request, target, String(body.tier || ""), delta);
    } else if (body.action === "revoke") {
      await revokeReferral(kv, request, target, String(body.referredId || ""));
    }

    const ent = await entitlement(kv, request, target, { other: true });
    return json({
      credits: await creditStatus(kv, ent),
      referrals: await listReferrals(kv, target.id),
      referredBy: await kv.get(`referredby:${target.id}`),
    });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not update credits." }, 400);
  }
}
