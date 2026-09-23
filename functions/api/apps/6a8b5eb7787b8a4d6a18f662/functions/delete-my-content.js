// Called by Profile → Delete account just before Base44's delete-account (which only
// removes the User row). Removes what the account made that lives elsewhere:
// its published sites and games (records, stored HTML, gallery entries) and its game
// draft. Pages an admin took down keep their stored HTML as a record of the take-down.
// Credit, purchase and referral records stay (payments and fraud prevention).
// -> { ok, sites, games }
import { json, base44, kvKey, ENTITY } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { isBlocked } from "../../../../../cloudflare-lib/reports.js";
import { setShowcase } from "../../../../../cloudflare-lib/showcase.js";

async function mine(request, kind, userId) {
  const q = encodeURIComponent(JSON.stringify({ created_by_id: userId }));
  const rows = await base44(request, "GET", `entities/${ENTITY[kind]}?q=${q}`);
  return (Array.isArray(rows) ? rows : []).filter((r) => r.created_by_id === userId);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in." }, 401);
    const done = { site: 0, game: 0 };
    for (const kind of ["site", "game"]) {
      for (const rec of await mine(request, kind, user.id)) {
        await base44(request, "DELETE", `entities/${ENTITY[kind]}/${rec.id}`);
        const name = String(rec.name || "").toLowerCase();
        if (kv && name && !(await isBlocked(kv, kind, name))) await kv.delete(kvKey(kind, name));
        if (kv && kind === "site" && name) await setShowcase(kv, name, null);
        done[kind]++;
      }
    }
    if (kv) await kv.delete(`draft:${user.id}`);
    return json({ ok: true, sites: done.site, games: done.game });
  } catch (err) {
    return json({ error: `Couldn't remove your sites and games: ${(err && err.message) || "unknown error"}. Your account was not deleted.` }, 500);
  }
}
