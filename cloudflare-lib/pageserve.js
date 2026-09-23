// Shared by the functions that hand out published pages (functions/published/[kind]/
// [name].js and the get-site-html function): the scripts added to every page, the
// "removed" page, and the response headers. No imports besides injected.js.
import { stripInjected } from "./injected.js";

const APP_ORIGIN = "https://blackhole-ai-tech.com";

// Buy buttons call parent.postMessage({ type: 'blackhole-checkout', ... }). Inside the
// Blackhole Browser the app answers that (useSiteCheckout), but on the site's own
// subdomain there is no parent, so the message comes back to the page itself. This
// bridge catches it there (top-level only) and sends the buyer to the app's /buy page,
// which starts the Base44 Payments checkout.
export function withCheckoutBridge(html, name) {
  const site = JSON.stringify(name).replace(/</g, "\\u003c");
  return beforeBodyEnd(html,
    `<script data-bh>(function(){if(window.top!==window)return;window.addEventListener("message",function(e){var d=e.data;` +
    `if(e.source!==window||!d||d.type!=="blackhole-checkout")return;` +
    `location.href="${APP_ORIGIN}/buy?"+new URLSearchParams({site:${site},product:String(d.productId||""),qty:String(d.quantity||1)});});})();</script>`);
}

// A small "Report" link in the corner, so visitors can flag phishing, scams or abuse
// (it opens the app's /report page). Only when the page is shown on its own — inside
// the Blackhole Browser or Games front the app shows its own report button. Put in a
// closed shadow root on its own tag, so the page's CSS can't restyle or hide it.
export function withReportLink(html, kind, name) {
  const href = JSON.stringify(`${APP_ORIGIN}/report?${new URLSearchParams({ kind, name })}`).replace(/</g, "\\u003c");
  return beforeBodyEnd(html,
    `<script data-bh>(function(){if(window.top!==window)return;function add(){var h=document.createElement("bh-report");` +
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

export function removedPage(kind, why = "It was taken down for breaking the Blackhole AI rules.") {
  const what = kind === "game" ? "game" : "site";
  return (
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Removed</title><style>body{background:#05060f;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;` +
    `flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:16px;text-align:center}a{color:#818cf8}</style>` +
    `</head><body><h1>This ${what} has been removed</h1><p>${why}</p>` +
    `<p><a href="${APP_ORIGIN}">Go to Blackhole AI</a></p></body></html>`
  );
}

// This path is on the app's own origin (blackhole-ai-tech.com / nebuluxai.pages.dev),
// where the signed-in user's token lives in localStorage. A published page opened
// here directly must not run as that origin, or its scripts could read the token.
// The CSP sandbox gives it an opaque origin instead (scripts, forms and popups still
// work). Real visitors see sites on their own subdomain, which the router Worker
// serves with its own headers, so this doesn't affect them.
export const HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "content-security-policy": "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals",
  "x-content-type-options": "nosniff",
};

// Title/text come from the page's HTML, so entities like &amp; are already escaped.
const esc = (t) => String(t).replace(/"/g, "&quot;").replace(/</g, "&lt;");

// Link previews (chat apps, social sites) for pages that don't set their own: the
// page's <title> and first paragraph-ish text, credited to Blackhole AI.
export function withShareTags(html) {
  if (/<meta[^>]+property\s*=\s*["']?og:title/i.test(html)) return html;
  const title = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
  if (!title) return html;
  const text = ((html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 180);
  const tags =
    `<meta data-bh property="og:type" content="website"><meta data-bh property="og:title" content="${esc(title)}">` +
    (text ? `<meta data-bh property="og:description" content="${esc(text)}">` : "") +
    `<meta data-bh property="og:site_name" content="Made with Blackhole AI"><meta data-bh name="twitter:card" content="summary">`;
  const i = html.search(/<\/head>/i);
  return i >= 0 ? html.slice(0, i) + tags + html.slice(i) : html;
}

// The page as visitors get it: old copies of the added scripts removed, fresh ones added.
export function preparePage(html, kind, name) {
  let out = withShareTags(stripInjected(html));
  if (kind === "site") out = withCheckoutBridge(out, name);
  return withReportLink(out, kind, name);
}
