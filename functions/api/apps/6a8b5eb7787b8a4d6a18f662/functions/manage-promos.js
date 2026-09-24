// Replaces Base44's manage-promos (admin promo code screen). See cloudflare-lib/promos.js.
// { action: "list" | "create" | "update" | "delete", ... }
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { logAdmin } from "../../../../../cloudflare-lib/audit.js";
import { listPromos, createPromo, updatePromo, deletePromo } from "../../../../../cloudflare-lib/promos.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const user = await currentUser(request);
    if (!user || user.role !== "admin") return json({ error: "Admins only." }, 403);
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "list");
    if (action === "list") return json({ codes: await listPromos(kv, request) });
    // What a code does, for the admin log.
    const summary = (c) =>
      c.kind === "discount"
        ? { code: c.code, pct: c.pct, target: c.target, maxUses: c.maxUses, expiresAt: c.expiresAt, active: c.active }
        : { code: c.code, credits: c.credits, aiModel: c.aiModel, active: c.active };
    if (action === "create") {
      const code = await createPromo(kv, request, body);
      await logAdmin(kv, user, "promo-create", summary(code));
      return json({ ok: true, code });
    }
    if (action === "update") {
      const code = await updatePromo(kv, request, body);
      await logAdmin(kv, user, "promo-update", summary(code));
      return json({ ok: true, code });
    }
    if (action === "delete") {
      const gone = (await listPromos(kv, request)).find((p) => p.id === String(body.id || ""));
      await deletePromo(kv, request, body.id);
      await logAdmin(kv, user, "promo-delete", { code: gone ? gone.code : String(body.id || "") });
      return json({ ok: true });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    return json({ error: (err && err.message) || "Something went wrong." }, 400);
  }
}
