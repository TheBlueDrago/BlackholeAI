import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

// The built-in legacy codes, seeded into the editable PromoCode entity on first use so the
// admin can change what they grant, how long they last, and their usage caps.
const LEGACY = [
  { code: "HIINFINITYAI", plan: "pro", days: 30, globalCap: 50, perEmailLimit: 3, unlimited: false, active: true, label: "Legacy" },
  { code: "HIILIKECHEESE", plan: "pro", days: 30, globalCap: 5, perEmailLimit: 0, unlimited: false, active: true, label: "Legacy" },
  { code: "HOLACHEESEAI", plan: "team", days: 180, globalCap: 5, perEmailLimit: 1, unlimited: false, active: true, label: "Legacy" },
  { code: "INFINITEAIISTUFF", plan: "team", days: 0, globalCap: 0, perEmailLimit: 0, unlimited: true, active: true, label: "Legacy" },
  { code: "INFINITYAIISTUFF", plan: "secret", days: 0, globalCap: 0, perEmailLimit: 0, unlimited: true, active: true, label: "Legacy" },
];

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

    // Seed the legacy codes once so they become editable in the manager.
    const existing = await db.entities.PromoCode.list();
    if (existing.length === 0) {
      await db.entities.PromoCode.bulkCreate(LEGACY);
    }

    if (action === "list") {
      const all = await db.entities.PromoCode.list("-created_date", 200);
      return Response.json({ codes: all });
    }

    if (action === "create") {
      const code = String(body.code ?? "").trim().toUpperCase();
      const plan = String(body.plan ?? "pro");
      if (!code) return Response.json({ error: "Code is required." }, { status: 400 });
      if (!["pro", "team", "secret"].includes(plan)) {
        return Response.json({ error: "Invalid plan." }, { status: 400 });
      }
      const dup = await db.entities.PromoCode.filter({ code });
      if (dup?.length) return Response.json({ error: "That code already exists." }, { status: 400 });
      const rec = await db.entities.PromoCode.create({
        code,
        plan,
        days: Number(body.days ?? 30) || 0,
        globalCap: Number(body.globalCap ?? 0) || 0,
        perEmailLimit: Number(body.perEmailLimit ?? 0) || 0,
        unlimited: !!body.unlimited,
        active: body.active !== false,
        label: String(body.label ?? ""),
      });
      return Response.json({ ok: true, code: rec });
    }

    if (action === "update") {
      const id = String(body.id ?? "");
      if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
      const patch: Record<string, any> = {};
      if (body.plan !== undefined) {
        if (!["pro", "team", "secret"].includes(String(body.plan))) {
          return Response.json({ error: "Invalid plan." }, { status: 400 });
        }
        patch.plan = String(body.plan);
      }
      if (body.days !== undefined) patch.days = Number(body.days) || 0;
      if (body.globalCap !== undefined) patch.globalCap = Number(body.globalCap) || 0;
      if (body.perEmailLimit !== undefined) patch.perEmailLimit = Number(body.perEmailLimit) || 0;
      if (body.unlimited !== undefined) patch.unlimited = !!body.unlimited;
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