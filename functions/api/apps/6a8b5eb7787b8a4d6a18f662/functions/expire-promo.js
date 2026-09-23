// Replaces Base44's expire-promo: when a promo-granted Pro/Team plan has run out, set
// the user's own record back to Free (users may edit their own User row) and drop the
// expired admin grant. The credit system already ignores expired grants.
import { json, base44 } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ ok: false }, 401);
    const expired = user.planExpiresAt && new Date(user.planExpiresAt) < new Date();
    if (!((user.plan === "pro" || user.plan === "team") && expired)) return json({ ok: true, reverted: false });
    await base44(request, "PUT", "entities/User/me", { plan: "free", planExpiresAt: null });
    const kv = env.PUBLISHED_HTML;
    const grant = await kv.get(`grant:${user.id}`, "json").catch(() => null);
    if (grant && grant.planExpiresAt && new Date(grant.planExpiresAt) < new Date()) {
      delete grant.plan;
      delete grant.planExpiresAt;
      await kv.put(`grant:${user.id}`, JSON.stringify(grant));
    }
    return json({ ok: true, reverted: true });
  } catch {
    return json({ ok: false }, 500);
  }
}
