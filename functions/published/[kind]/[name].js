// Serves published website/game HTML out of the PUBLISHED_HTML KV namespace.
// The Base44 PublishedSite/PublishedGame `html` field points here (see
// cloudflare-lib/published.js), and Base44's get-site-html/get-game-html fetch it.
import { ENTITY, findByName, kvKey } from "../../../cloudflare-lib/published.js";

const APP_ORIGIN = "https://blackhole-ai-tech.com";

// Buy buttons call parent.postMessage({ type: 'blackhole-checkout', ... }). Inside the
// Blackhole Browser the app answers that (useSiteCheckout), but on the site's own
// subdomain there is no parent, so the message comes back to the page itself. This
// bridge catches it there (top-level only) and sends the buyer to the app's /buy page,
// which starts the Base44 Payments checkout.
function withCheckoutBridge(html, name) {
  const site = JSON.stringify(name).replace(/</g, "\\u003c");
  const bridge =
    `<script>(function(){if(window.top!==window)return;window.addEventListener("message",function(e){var d=e.data;` +
    `if(e.source!==window||!d||d.type!=="blackhole-checkout")return;` +
    `location.href="${APP_ORIGIN}/buy?"+new URLSearchParams({site:${site},product:String(d.productId||""),qty:String(d.quantity||1)});});})();</script>`;
  const i = html.toLowerCase().lastIndexOf("</body>");
  return i >= 0 ? html.slice(0, i) + bridge + html.slice(i) : html + bridge;
}

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
  return new Response(kind === "site" ? withCheckoutBridge(html, name) : html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
