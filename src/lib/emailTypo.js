// Sign-up: "Did you mean you@gmail.com?" for a mistyped email provider (gmial.com, yahoo.con).
// An account made with a wrong address can't get its sign-up code or reset its password. Only
// ever a suggestion: the person can keep what they typed.

// Real email domains that look like typos of the big ones, so they're never "corrected".
const REAL = new Set([
  "mail.com", "email.com", "gmx.com", "gmx.net", "gmx.de", "ymail.com", "rocketmail.com", "live.com", "msn.com",
  "me.com", "mac.com", "aim.com", "cloud.com", "googlemail.com", "proton.me", "pm.me", "zoho.com", "yandex.com", "qq.com",
]);
// Providers people mistype, and the typos of ".com" to fix for them.
const PROVIDERS = ["gmail", "yahoo", "hotmail", "outlook", "icloud", "protonmail", "aol", "live"];
const FUZZY = ["gmail", "yahoo", "hotmail", "outlook", "icloud", "protonmail"]; // long enough to guess from
const BAD_COM = new Set(["con", "cmo", "cm", "comm", "coom", "om", "vom", "xom", "ocm", "c0m", "cpm", "clm", "co", "comn", "cim", "cok"]);

// Edit distance, with swapped neighbours counting as one change ("gmial").
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

// -> the corrected email, or "" when it looks fine (or isn't one of the big providers).
export function emailSuggestion(email) {
  const m = /^([^@\s]+)@([^@\s]+)$/.exec(String(email || "").trim().toLowerCase());
  if (!m) return "";
  const [, user, domain] = m;
  if (REAL.has(domain)) return "";
  const dot = domain.indexOf(".");
  // "gmailcom": the dot was left out.
  if (dot < 0) {
    const name = domain.endsWith("com") ? domain.slice(0, -3) : "";
    return PROVIDERS.includes(name) ? `${user}@${name}.com` : "";
  }
  const name = domain.slice(0, dot);
  const tld = domain.slice(dot + 1);
  if (tld !== "com" && !BAD_COM.has(tld)) return ""; // other endings (.co.uk, .ca, .edu) are left alone
  let fixed = PROVIDERS.includes(name) ? name : "";
  if (!fixed) {
    for (const p of FUZZY) {
      const dist = distance(name, p);
      if (dist > 0 && dist <= (p.length >= 7 ? 2 : 1)) {
        fixed = p;
        break;
      }
    }
  }
  if (!fixed) return "";
  const out = `${fixed}.com`;
  return out === domain ? "" : `${user}@${out}`;
}
