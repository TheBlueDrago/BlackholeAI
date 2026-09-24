// Admin-only: records plan grants and bans/blocks where users can't edit them
// (User.plan/banned are self-editable via updateMe, so the credit system ignores
// them). The Monitor page calls this alongside its User update. Also used once to
// snapshot every existing user's plan and bonus balance when server-side credits
// went live. Body: { grants: [{ userId, plan?, planExpiresAt?, seats?, banned?, blockedUntil?, bonus? }] }
// (Secret can't be granted any more; Enterprise takes the number of seats.)
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser, applyGrant } from "../../../../../cloudflare-lib/credits.js";
import { logAdmin } from "../../../../../cloudflare-lib/audit.js";

const PLANS = ["free", "pro", "team", "enterprise"];

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in." }, 401);
    if (user.role !== "admin") return json({ error: "Admins only." }, 403);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }
    const grants = Array.isArray(body.grants) ? body.grants : [];
    const saved = [];
    for (const g of grants) {
      if (!g || typeof g.userId !== "string" || !g.userId) continue;
      if ("plan" in g && !PLANS.includes(g.plan)) continue;
      await applyGrant(env.PUBLISHED_HTML, g.userId, g);
      saved.push(g.userId);
      const changed = {};
      for (const f of ["plan", "planExpiresAt", "banned", "blockedUntil", "seats", "bonus"]) if (f in g) changed[f] = g[f];
      await logAdmin(env.PUBLISHED_HTML, user, "grant", { userId: g.userId, ...changed }, request);
    }
    return json({ ok: true, saved: saved.length });
  } catch (err) {
    return json({ error: "Could not save grants.", detail: String((err && err.message) || err) }, 500);
  }
}
