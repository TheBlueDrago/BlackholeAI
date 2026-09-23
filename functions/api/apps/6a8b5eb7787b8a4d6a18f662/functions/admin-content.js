// Admin only: every published site and game for Monitor → Published sites & games, with
// who made it and a safety flag (cloudflare-lib/scan.js), red first, then yellow, then
// green. { action: "list" } -> { items }
// { action: "ai-check", kind, name } -> { item } (Gemini reads the page; the verdict is
// saved in KV as review:<kind>:<name> and shown until the page changes).
import { json, base44, kvKey, ENTITY, MAX_BYTES } from "../../../../../cloudflare-lib/published.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { isBlocked } from "../../../../../cloudflare-lib/reports.js";
import { scanPage, reviewPage, flagRank } from "../../../../../cloudflare-lib/scan.js";

async function sourceHtml(kv, kind, rec) {
  const name = String(rec.name || "").toLowerCase();
  const ref = String(rec.html || "");
  if (!/^https?:\/\//.test(ref)) return ref;
  if (ref.includes(`/published/${kind}/`)) return (await kv.get(kvKey(kind, name))) || "";
  if (!ref.startsWith("https://")) return "";
  try {
    const res = await fetch(ref);
    const text = res.ok ? await res.text() : "";
    return text.length > MAX_BYTES ? "" : text;
  } catch {
    return "";
  }
}

// Short fingerprint so a saved AI verdict is dropped when the page changes.
function fingerprint(html) {
  let h = 0;
  for (let i = 0; i < html.length; i += Math.max(1, Math.floor(html.length / 4000))) h = (h * 31 + html.charCodeAt(i)) | 0;
  return `${html.length}:${h}`;
}

async function describe(kv, kind, rec, owners) {
  const html = await sourceHtml(kv, kind, rec);
  const scan = scanPage(html);
  const name = String(rec.name || "");
  const review = await kv.get(`review:${kind}:${name}`, "json").catch(() => null);
  const ai = review && review.fp === fingerprint(html) ? review : null;
  // The AI's verdict wins when it's stricter than the pattern check.
  const flag = ai && flagRank(ai.flag) < flagRank(scan.flag) ? ai.flag : scan.flag;
  const owner = owners.get(rec.created_by_id) || {};
  return {
    kind,
    name,
    title: rec.title || name,
    ownerEmail: owner.email || rec.ownerName || "",
    ownerName: owner.full_name || "",
    created: rec.created_date,
    hidden: !!rec.hidden,
    takenDown: await isBlocked(kv, kind, name.toLowerCase()),
    size: html.length,
    flag,
    malware: scan.malware,
    reasons: scan.reasons,
    ai: ai ? { flag: ai.flag, reasons: ai.reasons, at: ai.at } : null,
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const admin = await currentUser(request);
    if (!admin) return json({ error: "Please sign in." }, 401);
    if (admin.role !== "admin") return json({ error: "Admins only." }, 403);
    const body = await request.json().catch(() => ({}));

    const users = (await base44(request, "GET", "entities/User?limit=1000").catch(() => [])) || [];
    const owners = new Map(users.map((u) => [u.id, u]));

    if (body.action === "ai-check") {
      const kind = String(body.kind || "");
      if (!ENTITY[kind]) return json({ error: "kind required" }, 400);
      const q = encodeURIComponent(JSON.stringify({ name: String(body.name || "") }));
      const rec = ((await base44(request, "GET", `entities/${ENTITY[kind]}?q=${q}`)) || [])[0];
      if (!rec) return json({ error: "Not found." }, 404);
      const html = await sourceHtml(kv, kind, rec);
      if (!html) return json({ error: "That page has no content to check." }, 404);
      const verdict = await reviewPage(env.GEMINI_API_KEY, html, kind === "game" ? "game" : "website");
      await kv.put(`review:${kind}:${rec.name}`, JSON.stringify({ ...verdict, fp: fingerprint(html), at: new Date().toISOString() }));
      return json({ item: await describe(kv, kind, rec, owners) });
    }

    const items = [];
    for (const kind of ["site", "game"]) {
      const rows = (await base44(request, "GET", `entities/${ENTITY[kind]}?limit=500`).catch(() => [])) || [];
      for (const rec of rows) items.push(await describe(kv, kind, rec, owners));
    }
    items.sort((a, b) => flagRank(a.flag) - flagRank(b.flag) || b.malware - a.malware || String(b.created).localeCompare(String(a.created)));
    return json({ items });
  } catch (err) {
    return json({ error: (err && err.message) || "Could not load published pages." }, 500);
  }
}
