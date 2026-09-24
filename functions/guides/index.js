// Serves /guides with its own link preview and the list of guides already in the page
// (see cloudflare-lib/pagemeta.js and cloudflare-lib/guides.js).
import { withMeta, withContent, withAppHeaders, PAGES } from "../../cloudflare-lib/pagemeta.js";
import { guidesListHtml } from "../../cloudflare-lib/guides.js";

export async function onRequestGet({ request, env }) {
  const page = await env.ASSETS.fetch(new URL("/", request.url));
  if (!page.ok) return page;
  const html = withContent(withMeta(await page.text(), PAGES.guides), { body: guidesListHtml() });
  return new Response(html, { status: 200, headers: withAppHeaders(page.headers) });
}
