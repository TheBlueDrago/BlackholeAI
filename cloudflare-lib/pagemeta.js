// Link previews for the public pages. They're all the same app page (index.html), so chat
// apps and search engines would show the home page's title and text for every link; these
// small functions (functions/<page>.js) serve it with the page's own title, description and
// address instead. Game pages do the same with the game's name (playmeta.js).
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ORIGIN = "https://blackhole-ai-tech.com";

// Replacements are functions, never strings: in a replacement string "$1" or "$&" means a
// matched part, so a description like "Pro is $1 a month" came out garbled.
export function withMeta(html, { title, description, path }) {
  const full = `${title} · Blackhole AI`;
  const setMeta = (out, attr, key, value) =>
    out.replace(new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, "i"), (_, a, b) => a + esc(value) + b);
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(full)}</title>`);
  out = setMeta(out, "property", "og:title", full);
  out = setMeta(out, "property", "og:description", description);
  out = setMeta(out, "name", "description", description);
  if (path) {
    out = setMeta(out, "property", "og:url", ORIGIN + path);
    // Tells search engines this page's one true address (not the home page, not ?query copies).
    const canonical = `<link rel="canonical" href="${esc(ORIGIN + path)}" />\n</head>`;
    out = out.replace(/<link\s+rel="canonical"[^>]*>\s*/i, "").replace(/<\/head>/i, () => canonical);
  }
  return out;
}

// Extra tags for <head> (structured data) and text shown inside #root until the app starts,
// so search engines that don't run scripts still read the page. React replaces it on start.
export function withContent(html, { head = "", body = "" }) {
  let out = head ? html.replace(/<\/head>/i, () => `${head}\n</head>`) : html;
  if (body) out = out.replace(/<div id="root"><\/div>/i, () => `<div id="root">${body}</div>`);
  return out;
}

// The app's security headers (keep in step with public/_headers). Pages built by a function
// from the app page set them themselves, so they're protected the same way as the static app.
export const APP_HEADERS = {
  "x-frame-options": "SAMEORIGIN",
  "strict-transport-security": "max-age=31536000",
  "content-security-policy": "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(self), usb=(), payment=()",
};
export function withAppHeaders(from) {
  const headers = new Headers(from);
  headers.delete("content-length");
  for (const [k, v] of Object.entries(APP_HEADERS)) headers.set(k, v);
  return headers;
}

// A Pages Function handler that serves the app page with this page's preview details.
export const servePage = (meta) =>
  async function onRequestGet({ request, env }) {
    const page = await env.ASSETS.fetch(new URL("/", request.url));
    if (!page.ok) return page;
    return new Response(withMeta(await page.text(), meta), { status: 200, headers: withAppHeaders(page.headers) });
  };

export const PAGES = {
  arcade: { title: "Free games made with AI", description: "Play free games in your browser on any phone or computer. No download, no account. Every one was made by describing it to Blackhole AI.", path: "/arcade" },
  templates: { title: "Free website templates", description: "Pick a free template and change anything by telling the AI what you want. Publish it free at yourname.blackhole-ai-tech.com.", path: "/templates" },
  pricing: { title: "Pricing", description: "Free to start. Pro is $1 a month, Team is $5 a month for up to 3 people, credit packs start at $1, and Enterprise is priced per seat.", path: "/pricing" },
  business: { title: "Websites for your business", description: "Describe your business and get a website in minutes. Sell from your site, work as a team and keep your code.", path: "/business" },
  enterprise: { title: "Enterprise", description: "Blackhole AI for your whole organization: a seat for everyone and one shared pool of credits. For registered businesses.", path: "/enterprise" },
  about: { title: "About us", description: "We help people make websites and games just by describing them, on any phone or computer.", path: "/about" },
  contact: { title: "Contact us", description: "Questions, ideas, business or partnerships: email us, call us or send a message.", path: "/contact" },
  safety: { title: "Trust & safety", description: "How Blackhole AI keeps your account, your payments and the sites you publish safe, in plain words.", path: "/safety" },
  guides: { title: "Guides", description: "Short, step-by-step guides to making websites and games with AI, and getting them in front of people. No coding needed.", path: "/guides" },
  showcase: { title: "Gallery", description: "Real websites people made with Blackhole AI by describing them in a sentence.", path: "/showcase" },
};
