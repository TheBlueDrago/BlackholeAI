// Serves /guides/<slug> with the guide's own title and description for link previews, its
// full text inside the page for search engines, and Article data for search results.
// An unknown guide gets the app page with a 404 status (the app shows "not found").
import { withMeta, withContent, withAppHeaders } from "../../cloudflare-lib/pagemeta.js";
import { guideBySlug, guideHtml, guideJsonLd } from "../../cloudflare-lib/guides.js";

export async function onRequestGet({ request, env, params }) {
  const page = await env.ASSETS.fetch(new URL("/", request.url));
  if (!page.ok) return page;
  const g = guideBySlug(String(params.slug || ""));
  const html = await page.text();
  if (!g) return new Response(html, { status: 404, headers: withAppHeaders(page.headers) });
  const origin = "https://nebuluxai.com";
  const out = withContent(withMeta(html, { title: g.title, description: g.description, path: `/guides/${g.slug}` }), {
    head: guideJsonLd(g, origin),
    body: guideHtml(g),
  });
  return new Response(out, { status: 200, headers: withAppHeaders(page.headers) });
}
