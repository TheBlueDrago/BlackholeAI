// Public: has an admin taken this page down? { kind, name } -> { blocked }
// Games are loaded through Base44's get-game-html, which doesn't know about take-downs
// (and can't be replaced here: it counts plays with Base44 service access), so the
// game views ask this alongside it. One KV read.
import { json } from "../../../../../cloudflare-lib/published.js";
import { KINDS, isBlocked } from "../../../../../cloudflare-lib/reports.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const kind = String(body.kind || "");
  const name = String(body.name || "").toLowerCase();
  if (!KINDS.includes(kind) || !name) return json({ error: "kind and name required" }, 400);
  return json({ blocked: env.PUBLISHED_HTML ? await isBlocked(env.PUBLISHED_HTML, kind, name) : false });
}
