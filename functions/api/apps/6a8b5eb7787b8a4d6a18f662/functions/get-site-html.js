// Replaces Base44's hosted get-site-html (this exact path takes precedence over the
// catch-all proxy). The subdomain router Worker asks this for every page it serves on
// name.blackhole-ai-tech.com, and the Website Designer uses it to open a site for
// editing. Same contract: { name } -> { html, id, name, ownerName }.
//
// Base44's version returned whatever the PublishedSite record held, so a site written
// straight into the record (skipping publish-site) avoided the phishing check, the
// Report link, and even an admin take-down. Here every page goes through the same
// checks, wherever its HTML is kept (KV, inline in the record, or an older file URL).
import { json, findByName, kvKey, MAX_BYTES } from "../../../../../cloudflare-lib/published.js";
import { isBlocked } from "../../../../../cloudflare-lib/reports.js";
import { findCredentialForm } from "../../../../../cloudflare-lib/phishing.js";
import { removedPage, preparePage } from "../../../../../cloudflare-lib/pageserve.js";

async function sourceHtml(kv, site, name) {
  const ref = String(site.html || "");
  if (!/^https?:\/\//.test(ref)) return ref; // inline (older sites, or written directly)
  if (ref.includes("/published/site/")) return (kv && (await kv.get(kvKey("site", name)))) || "";
  if (!ref.startsWith("https://")) return "";
  const res = await fetch(ref);
  if (!res.ok) return "";
  const text = await res.text();
  return text.length > MAX_BYTES ? "" : text;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "").toLowerCase();
    if (!name) return json({ error: "name required" }, 400);
    const site = (await findByName(request, "site", name))[0];
    if (!site) return json({ error: "not found" }, 404);
    const reply = (html) => json({ html, id: site.id, name: site.name, ownerName: site.ownerName });

    if (kv && (await isBlocked(kv, "site", name))) return reply(removedPage("site"));
    const html = await sourceHtml(kv, site, name);
    if (!html) return json({ error: "not found" }, 404);
    if (findCredentialForm(html)) {
      return reply(removedPage("site", "It asks for passwords or card numbers and sends them to another website, which isn't allowed here."));
    }
    return reply(preparePage(html, "site", name));
  } catch (err) {
    return json({ error: (err && err.message) || "Could not load the site." }, 500);
  }
}
