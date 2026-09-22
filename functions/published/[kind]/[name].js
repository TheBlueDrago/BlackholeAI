// Serves published website/game HTML out of the PUBLISHED_HTML KV namespace.
// The Base44 PublishedSite/PublishedGame `html` field points here (see
// cloudflare-lib/published.js), and Base44's get-site-html/get-game-html fetch it.
import { ENTITY, findByName, kvKey } from "../../../cloudflare-lib/published.js";

export async function onRequestGet(context) {
  const { params, env } = context;
  const kind = String(params.kind || "");
  const name = String(params.name || "").toLowerCase();
  if (!ENTITY[kind] || !name || !env.PUBLISHED_HTML) return new Response("Not found", { status: 404 });

  try {
    // Only serve pages whose record still exists, so deleting a site/game takes it offline.
    const rows = await findByName(null, kind, name);
    if (!rows.length) return new Response("Not found", { status: 404 });
  } catch {
    // If Base44 is unreachable, still serve what's stored rather than failing the page.
  }

  const html = await env.PUBLISHED_HTML.get(kvKey(kind, name));
  if (html == null) return new Response("Not found", { status: 404 });
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
