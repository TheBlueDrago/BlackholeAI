// Which code blocks in a chat reply get a Preview button (components/chat/CodePreview.jsx):
// HTML, or an SVG picture. Blocks marked as another language don't.
export function previewable(lang, code) {
  const l = String(lang || "").toLowerCase();
  const c = String(code || "").trim();
  if (l === "html" || l === "svg" || (l === "xml" && /^<svg\b/i.test(c))) return c.length > 10;
  if (l) return false;
  return /^(<!doctype html|<html\b|<svg\b)/i.test(c);
}
