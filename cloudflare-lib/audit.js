// The admin log: a record of every admin action that changes money, credits, plans, bans,
// promo codes or take-downs, with who did it and when. If an admin account were ever taken
// over, this is where it shows. One KV key ("adminlog"), newest first, capped so it stays small.
const KEY = "adminlog";
const MAX = 300;

export async function readAdminLog(kv) {
  try {
    return (await kv.get(KEY, "json")) || [];
  } catch {
    return [];
  }
}

// `admin` is the signed-in admin (currentUser); `what` a short action name ("grant",
// "credits", "promo-create", …); `details` a small plain object. Never throws: a failed log
// write must not undo or block the action itself.
export async function logAdmin(kv, admin, what, details = {}) {
  try {
    const entry = {
      at: new Date().toISOString(),
      by: String((admin && (admin.email || admin.id)) || "unknown"),
      what: String(what),
      details: JSON.parse(JSON.stringify(details || {})),
    };
    const list = await readAdminLog(kv);
    await kv.put(KEY, JSON.stringify([entry, ...list].slice(0, MAX)));
  } catch (err) {
    console.error("audit: could not write the admin log", String(err));
  }
}
