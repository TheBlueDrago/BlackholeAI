import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { notifyAdmins } from "../../shared/adminNotify.ts";

// Promo codes grant a one-time chunk of credits for a chosen AI model. Each code
// is single-use: it expires after the first redemption. Granted credits are stored
// on the user as a "bonus" pool that persists across monthly resets until spent.
const MODELS = ["ai", "aiCode", "galaxy5", "space5"];

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

    const email = String(user.email ?? "").trim().toLowerCase();
    const db = base44.asServiceRole;

    const rec = (await db.entities.PromoCode.filter({ code }))?.[0];
    if (!rec || rec.active === false) {
      return Response.json({ error: "That promo code is not valid." }, { status: 400 });
    }
    const aiModel = MODELS.includes(String(rec.aiModel)) ? String(rec.aiModel) : "ai";
    const credits = Number(rec.credits) || 0;
    if (credits <= 0) {
      return Response.json({ error: "That promo code is not valid." }, { status: 400 });
    }

    // Single-use: the code expires after the first redemption.
    const already = await db.entities.PromoRedemption.filter({ code });
    if (already?.length) {
      return Response.json({ error: "This promo code has already been used." }, { status: 400 });
    }

    const cur = (user as any).bonus ?? {};
    const newBonus = {
      ai: Number(cur.ai ?? 0) + (aiModel === "ai" ? credits : 0),
      aiCode: Number(cur.aiCode ?? 0) + (aiModel === "aiCode" ? credits : 0),
      galaxy5: Number(cur.galaxy5 ?? 0) + (aiModel === "galaxy5" ? credits : 0),
      space5: Number(cur.space5 ?? 0) + (aiModel === "space5" ? credits : 0),
    };
    await db.entities.User.update(user.id, { bonus: newBonus });
    await db.entities.PromoCode.update(rec.id, { active: false });

    const nowIso = new Date().toISOString();
    await db.entities.PromoRedemption.create({
      code,
      userId: user.id,
      userEmail: email,
      redeemedAt: nowIso,
      aiModel,
      credits,
    });

    console.log("redeem-promo: granted credits", { userId: user.id, email, code, aiModel, credits });
    const rName = String(user.full_name ?? "").trim() || email;
    await notifyAdmins(
      db,
      "Blackhole AI promo redeemed",
      `${rName} redeemed a promo code.\n\nName: ${rName}\nEmail: ${email}\nCode: ${code}\nCredits: +${credits} ${aiModel}`
    );
    return Response.json({ ok: true, code, aiModel, credits });
  } catch (error) {
    console.error("redeem-promo: unhandled error", error);
    return Response.json({ error: "Something went wrong redeeming your code." }, { status: 500 });
  }
}