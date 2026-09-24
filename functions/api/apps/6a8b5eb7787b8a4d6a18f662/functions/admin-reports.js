// Admin-only moderation for the Monitor page (see cloudflare-lib/reports.js).
// Body: { action, kind, name }
//   "list"    -> { reports: [...], hidden: [...] }   (the default)
//   "count"   -> { open }   number of reported pages
//   "hide"    -> take the page offline (it shows "removed") and hide it from listings
//   "unhide"  -> put it back
//   "dismiss" -> clear its reports without hiding it
//   "hide-owner" { userId } -> take down every site and game that account really owns (for a
//             banned scammer), -> { taken: [{ kind, name }] }
import { json, findByName, base44, ownerOf } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { logAdmin } from "../../../../../cloudflare-lib/audit.js";
import { KINDS, REASONS, readReports, dismissReports, setBlocked } from "../../../../../cloudflare-lib/reports.js";

// Pages taken down in one "hide-owner" call, per kind (a safety cap).
const MAX_TAKE_DOWN = 100;

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
    if (body.action === "hide-owner") {
      const userId = String(body.userId || "");
      if (!userId) return json({ error: "userId required" }, 400);
      // Their own rows, but only names they really own (ownerOf): a copycat row they wrote
      // for someone else's site name must not take that site down.
      const taken = [];
      for (const [k, entity] of [["site", "PublishedSite"], ["game", "PublishedGame"]]) {
        const rows = await base44(request, "GET", `entities/${entity}?q=${encodeURIComponent(JSON.stringify({ created_by_id: userId }))}`);
        for (const r of (Array.isArray(rows) ? rows : []).slice(0, MAX_TAKE_DOWN)) {
          const n = String(r.name || "").toLowerCase();
          if (!n || taken.some((t) => t.kind === k && t.name === n)) continue;
          if ((await ownerOf(request, kv, k, n)) !== userId) continue;
          await setBlocked(kv, request, k, n, true);
          await dismissReports(kv, k, n);
          taken.push({ kind: k, name: n });
        }
      }
      await logAdmin(kv, admin, "take-down-all", { userId, count: taken.length, pages: taken.slice(0, 20).map((t) => `${t.kind}:${t.name}`) }, request);
      return json({ taken });
    }
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
