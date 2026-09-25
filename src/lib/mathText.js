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

// Formulas as words, for Read aloud: "$\frac{1}{2}$" → "1 over 2", "x^2" → "x squared".
function formulaWords(f) {
  let s = f;
  for (let i = 0; i < 4; i++) {
    s = s
      .replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, " $1 over $2 ")
      .replace(/\\sqrt\s*\{([^{}]*)\}/g, " the square root of $1 ");
  }
  return s
    .replace(/\^\s*\{?2\}?(?![0-9])/g, " squared ")
    .replace(/\^\s*\{?3\}?(?![0-9])/g, " cubed ")
    .replace(/\^\s*\{([^{}]*)\}|\^\s*(\S)/g, (_, a, b) => ` to the power of ${a || b} `)
    .replace(/_\s*\{([^{}]*)\}|_\s*(\S)/g, (_, a, b) => ` sub ${a || b} `)
    .replace(/\\pm/g, " plus or minus ")
    .replace(/\\(times|cdot)/g, " times ")
    .replace(/\\div/g, " divided by ")
    .replace(/\\(neq|ne)\b/g, " is not equal to ")
    .replace(/\\(leq|le)\b/g, " is at most ")
    .replace(/\\(geq|ge)\b/g, " is at least ")
    .replace(/\\approx/g, " is about ")
    .replace(/\\(left|right|displaystyle|quad|qquad|,|;|!)/g, " ")
    .replace(/\\text\s*\{([^{}]*)\}/g, " $1 ")
    .replace(/\\([A-Za-z]+)/g, " $1 ")
    .replace(/[{}]/g, " ")
    .replace(/=/g, " equals ")
    .replace(/(\S)\s*-\s*(\S)/g, "$1 minus $2")
    .replace(/\s+/g, " ")
    .trim();
}

export function mathToWords(text) {
  const { text: t, hasMath } = prepareMath(text);
  if (!hasMath) return String(text || "");
  return t.replace(/\$\$([\s\S]+?)\$\$/g, (_, f) => ` ${formulaWords(f)} `);
}
