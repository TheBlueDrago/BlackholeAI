// Every published website gets a real name: its web address can't stay a placeholder like
// "my-site", and a page without a proper <title> (the name in the browser tab, in search
// results and when the link is shared) gets one from the site's name.
const PLACEHOLDERS = new Set(["my-site", "your-site", "my-website", "website", "site", "new-site", "untitled", "test", "my-game", "new-game", "game"]);

export const isPlaceholderName = (name) => {
  const n = String(name || "").trim().toLowerCase();
  return !n || PLACEHOLDERS.has(n) || /^(my-)?(site|website|game)-?\d*$/.test(n);
};

// "joes-bakery" -> "Joes Bakery"
export const displayName = (name) =>
  String(name || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const GENERIC_TITLE = /^(document|untitled|new (game|site|website|page)|my (site|website|game)|website|home|index)?$/i;

// The page's HTML with a proper <title>: kept if it has a real one, else the site's name.
export function withTitle(html, name) {
  const src = String(html || "");
  const title = displayName(name);
  if (!title) return src;
  const m = src.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (m && !GENERIC_TITLE.test(m[1].trim())) return src;
  const tag = `<title>${escapeHtml(title)}</title>`;
  if (m) return src.replace(m[0], () => tag);
  if (/<head\b[^>]*>/i.test(src)) return src.replace(/<head\b[^>]*>/i, (h) => `${h}\n${tag}`);
  return `${tag}\n${src}`;
}
