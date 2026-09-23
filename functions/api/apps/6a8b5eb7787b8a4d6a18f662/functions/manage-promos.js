// Replaces Base44's manage-promos (admin promo code screen). See cloudflare-lib/promos.js.
// { action: "list" | "create" | "update" | "delete", ... }
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
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
    if (action === "create") return json({ ok: true, code: await createPromo(kv, request, body) });
    if (action === "update") return json({ ok: true, code: await updatePromo(kv, request, body) });
    if (action === "delete") {
      await deletePromo(kv, request, body.id);
      return json({ ok: true });
    }
    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    return json({ error: (err && err.message) || "Something went wrong." }, 400);
  }
}
