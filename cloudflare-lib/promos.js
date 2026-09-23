// Promo codes, kept in KV (one "promos" key: [{ id, code, aiModel, credits, active,
// label, created_date, redeemedBy, redeemedAt }]) instead of Base44's PromoCode table:
// Base44's redeem/manage functions used up the Base44 integration allowance and failed
// once it ran out. The first time an admin opens the list, the old PromoCode rows are
// imported (admins can still read that table directly). Codes are single-use.
import { base44 } from "./published.js";
import { adjustBonus } from "./credits.js";

export const MODELS = ["ai", "aiCode", "galaxy5", "space5"];
const KEY = "promos";

export async function readPromos(kv) {
  try {
    return await kv.get(KEY, "json");
  } catch {
    return null;
  }
}

async function savePromos(kv, list) {
  await kv.put(KEY, JSON.stringify(list));
}

// Admin: the list, importing Base44's PromoCode rows the first time.
export async function listPromos(kv, request) {
  let list = await readPromos(kv);
  if (list) return list;
  list = [];
  try {
    const rows = (await base44(request, "GET", "entities/PromoCode?sort=-created_date&limit=200")) || [];
    const used = (await base44(request, "GET", "entities/PromoRedemption?limit=500")) || [];
    for (const r of rows) {
      const red = used.find((u) => String(u.code).toUpperCase() === String(r.code).toUpperCase());
      list.push({
        id: r.id,
        code: String(r.code || "").toUpperCase(),
        aiModel: MODELS.includes(r.aiModel) ? r.aiModel : "ai",
        credits: Number(r.credits) || 0,
        active: r.active !== false && !red,
        label: r.label || "",
        created_date: r.created_date || new Date().toISOString(),
        redeemedBy: red ? red.userId : null,
        redeemedAt: red ? red.redeemedAt : null,
      });
    }
  } catch {
    // Couldn't read the old table: start empty.
  }
  await savePromos(kv, list);
  return list;
}

export async function createPromo(kv, request, body) {
  const list = await listPromos(kv, request);
  const code = String(body.code || "").trim().toUpperCase();
  if (!code) throw new Error("Code is required.");
  const credits = Number(body.credits) || 0;
  if (credits <= 0) throw new Error("Credits must be greater than 0.");
  if (list.some((p) => p.code === code)) throw new Error("That code already exists.");
  const rec = {
    id: crypto.randomUUID(),
    code,
    aiModel: MODELS.includes(String(body.aiModel)) ? String(body.aiModel) : "ai",
    credits,
    active: body.active !== false,
    label: String(body.label || ""),
    created_date: new Date().toISOString(),
    redeemedBy: null,
    redeemedAt: null,
  };
  await savePromos(kv, [rec, ...list]);
  return rec;
}

export async function updatePromo(kv, request, body) {
  const list = await listPromos(kv, request);
  const rec = list.find((p) => p.id === String(body.id || ""));
  if (!rec) throw new Error("Code not found.");
  if (body.aiModel !== undefined) {
    if (!MODELS.includes(String(body.aiModel))) throw new Error("Invalid AI model.");
    rec.aiModel = String(body.aiModel);
  }
  if (body.credits !== undefined) rec.credits = Number(body.credits) || 0;
  if (body.active !== undefined) rec.active = !!body.active;
  if (body.label !== undefined) rec.label = String(body.label);
  await savePromos(kv, list);
  return rec;
}

export async function deletePromo(kv, request, id) {
  const list = await listPromos(kv, request);
  await savePromos(kv, list.filter((p) => p.id !== String(id || "")));
}

// A signed-in user redeems a code: its credits go into their bonus balance, and the
// code stops working (single use).
export async function redeemPromo(kv, request, user, rawCode) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) throw new Error("Enter a promo code.");
  // Until an admin has opened the list once (importing the old codes), there are none.
  const list = (await readPromos(kv)) || [];
  const rec = list.find((p) => p.code === code);
  if (!rec || !rec.active || rec.credits <= 0) {
    if (rec && rec.redeemedBy) throw new Error("This promo code has already been used.");
    throw new Error("That promo code is not valid.");
  }
  rec.active = false;
  rec.redeemedBy = user.id;
  rec.redeemedAt = new Date().toISOString();
  await savePromos(kv, list);
  await adjustBonus(kv, request, user, rec.aiModel, rec.credits);
  return { code, aiModel: rec.aiModel, credits: rec.credits };
}
