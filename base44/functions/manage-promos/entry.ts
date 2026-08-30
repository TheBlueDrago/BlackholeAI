import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// Promo codes are managed entirely as rows in the PromoCode entity — none are hardcoded.
// Each code grants a one-time credit boost to a chosen AI model.
const MODELS = ["ai", "aiCode", "galaxy5", "space5"];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admins only." }, { status: 403 });
    }
    const db = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "list");

    if (action === "list") {
      const all = await db.entities.PromoCode.list("-created_date", 200);
      return Response.json({ codes: all });
    }

    if (action === "create") {
      const code = String(body.code ?? "").trim().toUpperCase();
      if (!code) return Response.json({ error: "Code is required." }, { status: 400 });
      const aiModel = MODELS.includes(String(body.aiModel)) ? String(body.aiModel) : "ai";
      const credits = Number(body.credits) || 0;
      if (credits <= 0) {
        return Response.json({ error: "Credits must be greater than 0." }, { status: 400 });
      }
      const dup = await db.entities.PromoCode.filter({ code });
      if (dup?.length) return Response.json({ error: "That code already exists." }, { status: 400 });
      const rec = await db.entities.PromoCode.create({
        code,
        aiModel,
        credits,
        active: body.active !== false,
        label: String(body.label ?? ""),
      });
      return Response.json({ ok: true, code: rec });
    }

    if (action === "update") {
      const id = String(body.id ?? "");
      if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
      const patch: Record<string, any> = {};
      if (body.aiModel !== undefined) {
        if (!MODELS.includes(String(body.aiModel))) {
          return Response.json({ error: "Invalid AI model." }, { status: 400 });
        }
        patch.aiModel = String(body.aiModel);
      }
      if (body.credits !== undefined) patch.credits = Number(body.credits) || 0;
      if (body.active !== undefined) patch.active = !!body.active;
      if (body.label !== undefined) patch.label = String(body.label);
      const rec = await db.entities.PromoCode.update(id, patch);
      return Response.json({ ok: true, code: rec });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
      await db.entities.PromoCode.delete(id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("manage-promos: unhandled error", error);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}