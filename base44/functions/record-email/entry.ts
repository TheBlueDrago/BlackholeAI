import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { notifyAdmins } from "../../shared/adminNotify.ts";

// Records the logged-in user's email as "seen", so a later re-registration attempt with
// that email (after the account is deleted) can be detected and blocked. Idempotent.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ ok: false }, { status: 401 });
    }
    const email = String(user.email ?? "").trim().toLowerCase();
    if (!email) {
      return Response.json({ ok: false }, { status: 400 });
    }

    const db = base44.asServiceRole;
    const existing = await db.entities.SeenEmail.filter({ email });
    if (!existing || existing.length === 0) {
      await db.entities.SeenEmail.create({ email, firstSeenAt: new Date().toISOString() });
      const name = String(user.full_name ?? "").trim() || email;
      await notifyAdmins(
        db,
        "New Infinity AI account",
        `${name} just joined Infinity AI.\n\nName: ${name}\nEmail: ${email}`
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("record-email: unhandled error", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}