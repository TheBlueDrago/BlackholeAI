// The public site gallery (see cloudflare-lib/showcase.js).
// Body: { action: "list" }                     -> { sites: [{ name, title, added }] }  (anyone)
//       { action: "set", name, on, title? }    -> { ok, sites }  (the site's owner or an admin)
import { json, findByName } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { isBlocked } from "../../../../../cloudflare-lib/reports.js";
import { readShowcase, setShowcase, MAX_SHOWCASE } from "../../../../../cloudflare-lib/showcase.js";

const list = async (kv) =>
  Object.entries(await readShowcase(kv))
    .map(([name, e]) => ({ name, title: e.title || "", added: e.added }))
    .sort((a, b) => String(b.added).localeCompare(String(a.added)));

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    if (!kv) return json({ sites: [] });
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
    if (body.action !== "set") return json({ sites: await list(kv) });

    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in." }, 401);
    const name = String(body.name || "").toLowerCase();
    const rows = await findByName(request, "site", name);
    const site = rows[0];
    if (!site) return json({ error: "Site not found." }, 404);
    if (site.created_by_id !== user.id && user.role !== "admin") return json({ error: "Only the site's owner can do that." }, 403);

    if (body.on) {
      if (site.hidden || (await isBlocked(kv, "site", name))) {
        return json({ error: "Publish the site (make it visible) before adding it to the gallery." }, 400);
      }
      const title = String(body.title || "").trim().slice(0, 60);
      if (!(await setShowcase(kv, name, { owner: site.created_by_id, title }))) {
        return json({ error: `The gallery is full (${MAX_SHOWCASE} sites).` }, 409);
      }
    } else {
      await setShowcase(kv, name, null);
    }
    return json({ ok: true, sites: await list(kv) });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not update the gallery." }, 500);
  }
}
