// Enterprise plan applications (see cloudflare-lib/enterprise.js).
// Signed in: { action: "apply", ...details, confirm: true } -> { application }
//            { action: "mine" } -> { application | null }
// Admins:    { action: "list" } -> { applications }  (each with its quote and warnings)
//            { action: "set-status", id, status: "new"|"approved"|"rejected", note? } -> { applications }
//            { action: "activate", id } -> { applications }  (gives the applicant's account the
//            Enterprise plan with the application's seats; do it once they've paid)
//            { action: "count" } -> { open }
import { json, base44 } from "../../../../../cloudflare-lib/published.js";
import { currentUser, applyGrant } from "../../../../../cloudflare-lib/credits.js";
import { allow, TOO_MANY } from "../../../../../cloudflare-lib/ratelimit.js";
import { logAdmin } from "../../../../../cloudflare-lib/audit.js";
import {
  validateApplication, submitApplication, updateApplication, readApps, appOf, publicView, quoteFor, warningsFor, ENTITY_TYPES,
} from "../../../../../cloudflare-lib/enterprise.js";

const forAdmin = (apps) =>
  apps.map((a) => ({ ...a, entityLabel: ENTITY_TYPES[a.entityType] || a.entityType, quote: quoteFor(a.seats, a.discountPct || 0), warnings: warningsFor(a) }));

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    if (!kv) return json({ error: "Applications aren't available right now." }, 500);
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in first." }, 401);
    const body = await request.json().catch(() => ({}));

    if (body.action === "mine") return json({ application: publicView(appOf(await readApps(kv), user.id)) });

    if (body.action === "apply") {
      if (!(await allow(`enterprise:${user.id}`, 5, 3600))) return json({ error: TOO_MANY }, 429);
      const { app, error } = validateApplication(body);
      if (error) return json({ error }, 400);
      return json({ application: publicView(await submitApplication(kv, user, app)) });
    }

    if (user.role !== "admin") return json({ error: "Admins only." }, 403);
    if (body.action === "count") return json({ open: (await readApps(kv)).filter((a) => a.status === "new").length });
    if (body.action === "set-status") {
      const status = String(body.status || "");
      if (!["new", "approved", "rejected"].includes(status)) return json({ error: "Unknown status." }, 400);
      await updateApplication(kv, String(body.id || ""), { status, note: String(body.note || "").slice(0, 500) });
      await logAdmin(kv, user, "enterprise-status", { id: String(body.id || ""), status });
    } else if (body.action === "activate") {
      const app = (await readApps(kv)).find((a) => a.id === String(body.id || ""));
      if (!app) return json({ error: "Application not found." }, 404);
      if (app.status !== "approved" && app.status !== "active") return json({ error: "Approve the application first." }, 400);
      await applyGrant(kv, app.userId, { plan: "enterprise", planExpiresAt: null, seats: app.seats });
      // Mirrors the plan on the User row for the app's badges, as Monitor's plan buttons do.
      await base44(request, "PUT", `entities/User/${app.userId}`, { plan: "enterprise", planExpiresAt: null }).catch(() => {});
      await updateApplication(kv, app.id, { status: "active", activatedAt: new Date().toISOString() });
      await logAdmin(kv, user, "enterprise-activate", { userId: app.userId, seats: app.seats });
    } else if (body.action !== "list") {
      return json({ error: "Unknown action." }, 400);
    }
    return json({ applications: forAdmin(await readApps(kv)) });
  } catch (err) {
    return json({ error: (err && err.message) || "Something went wrong." }, 500);
  }
}
