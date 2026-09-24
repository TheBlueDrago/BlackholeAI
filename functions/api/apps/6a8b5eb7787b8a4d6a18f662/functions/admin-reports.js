// Admin-only moderation for the Monitor page (see cloudflare-lib/reports.js).
// Body: { action, kind, name }
//   "list"    -> { reports: [...], hidden: [...] }   (the default)
//   "count"   -> { open }   number of reported pages
//   "hide"    -> take the page offline (it shows "removed") and hide it from listings
//   "unhide"  -> put it back
//   "dismiss" -> clear its reports without hiding it
import { json, findByName } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { logAdmin } from "../../../../../cloudflare-lib/audit.js";
import { KINDS, REASONS, readReports, dismissReports, setBlocked } from "../../../../../cloudflare-lib/reports.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const admin = await currentUser(request);
    if (!admin) return json({ error: "Please sign in." }, 401);
    if (admin.role !== "admin") return json({ error: "Admins only." }, 403);

    const body = await request.json().catch(() => ({}));
    // Just the number of reported pages (for the badge on the Monitor button): one KV
    // read, and no list operation (those are limited to 1,000/day on the free plan).
    if (body.action === "count") return json({ open: Object.keys(await readReports(kv)).length });
    const kind = String(body.kind || "");
    const name = String(body.name || "").toLowerCase();
    if (body.action && body.action !== "list") {
      if (!KINDS.includes(kind) || !name) return json({ error: "kind and name required" }, 400);
      if (body.action === "hide") {
        // Catch typos from Monitor's "take down by name" box.
        if (!(await findByName(request, kind, name)).length) return json({ error: `No ${kind} is called "${name}".` }, 404);
        await setBlocked(kv, request, kind, name, true);
        await dismissReports(kv, kind, name);
        await logAdmin(kv, admin, "take-down", { kind, name }, request);
      } else if (body.action === "unhide") {
        await setBlocked(kv, request, kind, name, false);
        await logAdmin(kv, admin, "restore", { kind, name }, request);
      } else if (body.action === "dismiss") {
        await dismissReports(kv, kind, name);
      } else {
        return json({ error: "Unknown action" }, 400);
      }
    }

    const all = await readReports(kv);
    const reports = Object.values(all)
      .map((p) => ({ ...p, reports: p.reports.map((r) => ({ ...r, label: REASONS[r.reason] || r.reason })) }))
      .sort((a, b) => String(b.last).localeCompare(String(a.last)));
    const listed = await kv.list({ prefix: "blocked:" }).catch(() => ({ keys: [] }));
    const hidden = listed.keys.map((k) => {
      const [, pageKind, ...rest] = k.name.split(":");
      return { kind: pageKind, name: rest.join(":") };
    });
    return json({ reports, hidden });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not load reports." }, 400);
  }
}
