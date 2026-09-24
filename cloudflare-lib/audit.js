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

// Where a request came from, as Cloudflare sees it: { country: "US", from: "Dallas, US" }.
// Stored with each entry so an admin action from somewhere unexpected stands out.
export function placeOf(request) {
  try {
    const cf = (request && request.cf) || {};
    const country = String((request && request.headers.get("cf-ipcountry")) || cf.country || "").slice(0, 8);
    return { country, from: [cf.city, country].filter(Boolean).join(", ").slice(0, 80) };
  } catch {
    return { country: "", from: "" };
  }
}

// The countries admin actions came from in the last `days` days, most recent first. More
// than one (or "T1", Cloudflare's code for the Tor network) is worth a look: either the
// admin travelled, or someone else is signed in as them. Used by Monitor.
export function adminCountries(entries, days = 30, now = Date.now()) {
  const seen = [];
  for (const e of entries || []) {
    if (now - Date.parse(e.at) > days * 86400000) continue;
    if (e.country && e.country !== "XX" && !seen.includes(e.country)) seen.push(e.country);
  }
  return seen;
}

// `admin` is the signed-in admin (currentUser); `what` a short action name ("grant",
// "credits", "promo-create", …); `details` a small plain object; `request` the admin's
// request, for where it came from. Never throws: a failed log write must not undo or block
// the action itself.
export async function logAdmin(kv, admin, what, details = {}, request = null) {
  try {
    const entry = {
      at: new Date().toISOString(),
      by: String((admin && (admin.email || admin.id)) || "unknown"),
      what: String(what),
      details: JSON.parse(JSON.stringify(details || {})),
    };
    const { country, from } = placeOf(request);
    if (country) entry.country = country;
    if (from) entry.from = from;
    const list = await readAdminLog(kv);
    await kv.put(KEY, JSON.stringify([entry, ...list].slice(0, MAX)));
  } catch (err) {
    console.error("audit: could not write the admin log", String(err));
  }
}
