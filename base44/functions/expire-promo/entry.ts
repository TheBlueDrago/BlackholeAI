import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Reverts an expired promo-granted plan to free. Called from the "promo expired" popup
// so the user explicitly closes it out (and, for promo users, never gets charged).
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false }, { status: 401 });
    const db = base44.asServiceRole;

    const expired = user.planExpiresAt && new Date(user.planExpiresAt) < new Date();
    if ((user.plan === "pro" || user.plan === "team") && expired) {
      await db.entities.User.update(user.id, { plan: "free", planExpiresAt: null });
      if (user.plan === "team") {
        const t = (await db.entities.Team.filter({ ownerId: user.id }))?.[0];
        if (t) await db.entities.Team.update(t.id, { status: "inactive" });
      }
      return Response.json({ ok: true, reverted: true });
    }
    return Response.json({ ok: true, reverted: false });
  } catch (error) {
    console.error("expire-promo: unhandled error", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}