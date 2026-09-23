// Serves published website/game HTML out of the PUBLISHED_HTML KV namespace.
// The Base44 PublishedSite/PublishedGame `html` field points here (see
// cloudflare-lib/published.js), and Base44's get-site-html/get-game-html fetch it.
import { ENTITY, findByName, kvKey } from "../../../cloudflare-lib/published.js";
import { isBlocked } from "../../../cloudflare-lib/reports.js";

const APP_ORIGIN = "https://blackhole-ai-tech.com";

// Buy buttons call parent.postMessage({ type: 'blackhole-checkout', ... }). Inside the
// Blackhole Browser the app answers that (useSiteCheckout), but on the site's own
// subdomain there is no parent, so the message comes back to the page itself. This
// bridge catches it there (top-level only) and sends the buyer to the app's /buy page,
// which starts the Base44 Payments checkout.
function withCheckoutBridge(html, name) {
  const site = JSON.stringify(name).replace(/</g, "\\u003c");
  return beforeBodyEnd(html,
    `<script>(function(){if(window.top!==window)return;window.addEventListener("message",function(e){var d=e.data;` +
    `if(e.source!==window||!d||d.type!=="blackhole-checkout")return;` +
    `location.href="${APP_ORIGIN}/buy?"+new URLSearchParams({site:${site},product:String(d.productId||""),qty:String(d.quantity||1)});});})();</script>`);
}

// A small "Report" link in the corner, so visitors can flag phishing, scams or abuse
// (it opens the app's /report page). Only when the page is shown on its own — inside
// the Blackhole Browser or Games front the app shows its own report button. Put in a
// closed shadow root on its own tag, so the page's CSS can't restyle or hide it.
function withReportLink(html, kind, name) {
  const href = JSON.stringify(`${APP_ORIGIN}/report?${new URLSearchParams({ kind, name })}`).replace(/</g, "\\u003c");
  return beforeBodyEnd(html,
    `<script>(function(){if(window.top!==window)return;function add(){var h=document.createElement("bh-report");` +
    `h.style.cssText="all:initial;position:fixed;right:8px;bottom:8px;z-index:2147483647";var r=h.attachShadow({mode:"closed"});` +
    `r.innerHTML='<a target="_blank" rel="noopener" style="font:12px system-ui,sans-serif;color:#cbd5e1;background:rgba(15,23,42,.8);` +
    `padding:4px 9px;border-radius:999px;text-decoration:none;border:1px solid rgba(148,163,184,.35)">\u2691 Report</a>';` +
    `r.querySelector("a").href=${href};document.documentElement.appendChild(h);}` +
    `if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",add);else add();})();</script>`);
}

function beforeBodyEnd(html, snippet) {
  const i = html.toLowerCase().lastIndexOf("</body>");
  return i >= 0 ? html.slice(0, i) + snippet + html.slice(i) : html + snippet;
}

function removedPage(kind) {
  const what = kind === "game" ? "game" : "site";
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Removed</title><style>body{background:#05060f;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;` +
    `flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;text-align:center}a{color:#818cf8}</style>` +
    `</head><body><h1>This ${what} has been removed</h1><p>It was taken down for breaking the Blackhole AI rules.</p>` +
    `<p><a href="${APP_ORIGIN}">Go to Blackhole AI</a></p></body></html>`
  );
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

  if (await isBlocked(env.PUBLISHED_HTML, kind, name)) {
    // Status 200 on purpose: Base44's get-site-html passes the body on to the subdomain
    // Worker whatever the status, and the visitor should see why the page is gone.
    return new Response(removedPage(kind), {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  let html = await env.PUBLISHED_HTML.get(kvKey(kind, name));
  if (html == null) return new Response("Not found", { status: 404 });
  if (kind === "site") html = withCheckoutBridge(html, name);
  html = withReportLink(html, kind, name);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
