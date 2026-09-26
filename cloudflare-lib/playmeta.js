// Link previews for shared games: /play/<name> is the app's page, so without this every
// shared game shows up in chat apps as plain "Nebulux AI". Rewrites the app's
// index.html title and share tags to name the game (see functions/play/[name].js).
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function withGameMeta(html, { title, genre }) {
  const name = String(title || "").trim().slice(0, 80);
  if (!name) return html;
  const heading = `Play ${name}`;
  const text = `${genre ? `A ${String(genre).slice(0, 30)} game` : "A game"} made with Nebulux AI. Play it free in your browser, then make your own.`;
  // Function replacements: in a replacement string, "$1" in a name like "Win $100" means a matched part.
  const setMeta = (out, attr, key, value) =>
    out.replace(new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, "i"), (_, a, b) => a + esc(value) + b);
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(`${name} · Nebulux AI`)}</title>`);
  out = setMeta(out, "property", "og:title", heading);
  out = setMeta(out, "property", "og:description", text);
  out = setMeta(out, "name", "description", text);
  return out;
}
