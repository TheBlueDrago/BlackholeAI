import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Promo codes never expire.
// Limits (enforced by email so deleting & recreating an account can't reset them):
//  - per email: at most 1 redemption per rolling 30 days (any code)
//  - HIINFINITYAI: max 3 uses per email (lifetime) AND max 50 uses globally (scarcity)
//  - HIILIKECHEESE: max 5 uses globally (lifetime)
// Each redemption grants the Pro plan free for 30 days.
const CODES = {
  HIINFINITYAI: { perEmailLimit: 3, globalCap: 50 },
  HIILIKECHEESE: { globalCap: 5 },
};

const PRO_DAYS = 30;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Please sign in to redeem a promo code." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) {
      return Response.json({ error: "Enter a promo code." }, { status: 400 });
    }

    const def = CODES[code];
    if (!def) {
      return Response.json({ error: "That promo code is not valid." }, { status: 400 });
    }

    const email = String(user.email ?? "").trim().toLowerCase();
    if (!email) {
      return Response.json({ error: "Your account has no email address." }, { status: 400 });
    }

    const db = base44.asServiceRole;
    const now = new Date();
    const nowIso = now.toISOString();

    // If a previous promo-granted Pro has expired, revert to free so state stays clean.
    if (user.plan === "pro" && user.planExpiresAt && new Date(user.planExpiresAt) < now) {
      await db.entities.User.update(user.id, { plan: "free", planExpiresAt: null });
    }

    // 1 redemption per email per rolling 30 days (keyed on email, not the recyclable userId).
    const byEmail = await db.entities.PromoRedemption.filter({ userEmail: email });
    const withinMonth = byEmail.filter(
      (r) => now.getTime() - new Date(r.redeemedAt).getTime() < MONTH_MS
    );
    if (withinMonth.length > 0) {
      return Response.json(
        { error: "You can only redeem one promo code per month." },
        { status: 400 }
      );
    }

    // Per-email lifetime limit.
    if (def.perEmailLimit) {
      const uses = byEmail.filter((r) => r.code === code).length;
      if (uses >= def.perEmailLimit) {
        return Response.json(
          { error: `This code has reached its limit for your account (${def.perEmailLimit} uses).` },
          { status: 400 }
        );
      }
    }

    // Global scarcity cap.
    if (def.globalCap) {
      const allForCode = await db.entities.PromoRedemption.filter({ code });
      if (allForCode.length >= def.globalCap) {
        return Response.json(
          { error: "This promo is no longer available." },
          { status: 400 }
        );
      }
    }

    // Grant Pro for 30 days.
    const expiresAt = new Date(now.getTime() + PRO_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await db.entities.User.update(user.id, { plan: "pro", planExpiresAt: expiresAt });

    await db.entities.PromoRedemption.create({
      code,
      userId: user.id,
      userEmail: email,
      redeemedAt: nowIso,
      expiresAt,
    });

    console.log("redeem-promo: granted", { userId: user.id, email, code, expiresAt });
    return Response.json({ ok: true, code, expiresAt });
  } catch (error) {
    console.error("redeem-promo: unhandled error", error);
    return Response.json({ error: "Something went wrong redeeming your code." }, { status: 500 });
  }
}