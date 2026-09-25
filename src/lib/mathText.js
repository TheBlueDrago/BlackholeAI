// Math in AI replies ($x^2$, \frac{1}{2}) is shown as real formulas (components/chat/Markdown.jsx
// loads KaTeX only for replies that have some). Prices use $ too ("$5 or $10"), so a single-$
// span only counts as math when it looks like math; those spans are rewritten to $$…$$, which is
// the only form the math parser is told to read. \( \) and \[ \] become the same. Code is left alone.
const LOOKS_LIKE_MATH = /[\\^_{}=<>]|^[A-Za-z]$|^[A-Za-z]\s*[+\-*/]\s*[A-Za-z0-9]/;

function convert(part) {
  let hit = false;
  let out = part
    // Display math: \[ … \] on its own lines.
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => {
      hit = true;
      return `\n$$\n${m.trim()}\n$$\n`;
    })
    // Inline: \( … \).
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => {
      hit = true;
      return `$$${m.trim()}$$`;
    });
  // Existing $$ … $$ blocks already count.
  if (/\$\$[\s\S]+?\$\$/.test(out)) hit = true;
  // Single $ … $ on one line, not touching another $ (so $$ isn't split), when it looks like math.
  out = out.replace(/(^|[^$\\])\$(?!\$)([^$\n]{1,300}?)\$(?!\$)/g, (whole, before, m) => {
    const t = m.trim();
    if (!t || t !== m || !LOOKS_LIKE_MATH.test(t)) return whole;
    hit = true;
    return `${before}$$${t}$$`;
  });
  return { out, hit };
}

// -> { text, hasMath }
export function prepareMath(text) {
  const src = String(text || "");
  if (!/[$\\]/.test(src)) return { text: src, hasMath: false };
  // Code blocks and `inline code` keep their dollars and backslashes.
  const parts = src.split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/);
  let hasMath = false;
  const text2 = parts
    .map((p, i) => {
      if (i % 2) return p;
      const { out, hit } = convert(p);
      if (hit) hasMath = true;
      return out;
    })
    .join("");
  return { text: text2, hasMath };
}
