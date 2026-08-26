import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Promo codes never expire. Limits are enforced by email (deleting/recreating an account
// can't reset them). Each code grants a plan for a number of days.
//   HIINFINITYAI  — Pro, 30 days, max 3 uses per email + 50 uses globally
//   HIILIKECHEESE — Pro, 30 days, max 5 uses globally
//   HOLACHEESEAI    — Team, 180 days (6 months), 1 use per email, first 5 people globally
//   INFINITEAIISTUFF — Team, never expires, unlimited users & unlimited redemptions
const CODES = {
  HIINFINITYAI: { perEmailLimit: 3, globalCap: 50, plan: "pro", days: 30 },
  HIILIKECHEESE: { globalCap: 5, plan: "pro", days: 30 },
  HOLACHEESEAI: { perEmailLimit: 1, globalCap: 5, plan: "team", days: 180 },
  INFINITEAIISTUFF: { plan: "team", forever: true, unlimited: true },
  INFINITYAIISTUFF: { plan: "secret", forever: true, unlimited: true },
};

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
    if (!code) return Response.json({ error: "Enter a promo code." }, { status: 400 });
    const force = !!body.force;

    const def = CODES[code];
    if (!def) return Response.json({ error: "That promo code is not valid." }, { status: 400 });

    const email = String(user.email ?? "").trim().toLowerCase();
    if (!email) return Response.json({ error: "Your account has no email address." }, { status: 400 });

    // The Secret plan is the top tier (infinite credits, forever) — never let another promo overwrite it.
    if (user.plan === "secret") {
      return Response.json({ error: "You already have the Secret membership." }, { status: 400 });
    }

    const db = base44.asServiceRole;
    const now = new Date();
    const nowIso = now.toISOString();

    // Auto-revert an expired promo-granted plan so state stays clean.
    if ((user.plan === "pro" || user.plan === "team") && user.planExpiresAt && new Date(user.planExpiresAt) < now) {
      await db.entities.User.update(user.id, { plan: "free", planExpiresAt: null });
      if (user.plan === "team") {
        const t = (await db.entities.Team.filter({ ownerId: user.id }))?.[0];
        if (t) await db.entities.Team.update(t.id, { status: "inactive" });
      }
    }

    // 1 redemption per email per rolling 30 days (keyed on email, not the recyclable userId).
    const byEmail = await db.entities.PromoRedemption.filter({ userEmail: email });
    const withinMonth = byEmail.filter((r) => now.getTime() - new Date(r.redeemedAt).getTime() < MONTH_MS);
    if (!def.unlimited && withinMonth.length > 0 && !force) {
      return Response.json({ error: "You can only redeem one promo code per month." }, { status: 400 });
    }

    if (def.perEmailLimit) {
      const uses = byEmail.filter((r) => r.code === code).length;
      if (uses >= def.perEmailLimit) {
        return Response.json(
          { error: `This code has reached its limit for your account (${def.perEmailLimit} use).` },
          { status: 400 }
        );
      }
    }
    if (def.globalCap) {
      const allForCode = await db.entities.PromoRedemption.filter({ code });
      if (allForCode.length >= def.globalCap) {
        return Response.json({ error: "This promo is no longer available." }, { status: 400 });
      }
    }

    const expiresAt = def.forever ? null : new Date(now.getTime() + def.days * 24 * 60 * 60 * 1000).toISOString();
    await db.entities.User.update(user.id, { plan: def.plan, planExpiresAt: expiresAt });

    // Team grants also (re)activate the team record with a fresh shared credit pool, stamped to the
    // current month so the monthly reset (in my-team) is anchored — no stacking across periods.
    if (def.plan === "team") {
      const pk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const existing = (await db.entities.Team.filter({ ownerId: user.id }))?.[0];
      if (existing) {
        await db.entities.Team.update(existing.id, {
          status: "active",
          aiCodeUsed: 0,
          periodKey: pk,
          memberEmails: existing.memberEmails ?? [],
          pendingRemovalEmails: [],
          ownerLeaving: false,
        });
      } else {
        await db.entities.Team.create({
          ownerId: user.id,
          memberEmails: [],
          pendingRemovalEmails: [],
          ownerLeaving: false,
          aiCodeUsed: 0,
          periodKey: pk,
          status: "active",
        });
      }
    }

    await db.entities.PromoRedemption.create({ code, userId: user.id, userEmail: email, redeemedAt: nowIso, expiresAt });
    console.log("redeem-promo: granted", { userId: user.id, email, code, plan: def.plan, expiresAt });
    return Response.json({ ok: true, code, plan: def.plan, expiresAt });
  } catch (error) {
    console.error("redeem-promo: unhandled error", error);
    return Response.json({ error: "Something went wrong redeeming your code." }, { status: 500 });
  }
}