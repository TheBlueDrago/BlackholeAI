// Before a message goes to the AI from the main chat: does it look like something people
// (often young ones) shouldn't share with an AI or anyone online? A card number (checked with
// the Luhn sum, so random long numbers don't count), a secret key, a password written out, a
// phone number, or a home address.
// -> what was found ("a card number", …) or "". The designers use privateInfoOnPage below.
const luhn = (digits) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
};

// Keys and tokens that let whoever has them use someone's account (AI services, GitHub, cloud,
// payments). Pasted into a chat, or left in a public page's code, they can be copied and used.
// `inPage`: a published page, where a Google browser key (AIza…) is meant to be public.
const SECRET_KEYS = [
  /\bsk-ant-[A-Za-z0-9_-]{20,}/, // Anthropic
  /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/, // OpenAI
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/, // GitHub
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, // AWS access key
  /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}\b/, // Stripe secret
  /\bxox[abprs]-[0-9A-Za-z-]{10,}/, // Slack
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY( BLOCK)?-----/,
];
const GOOGLE_KEY = /\bAIza[0-9A-Za-z_-]{35}\b/;
// api_key = "…", "token": "…" with a long value that isn't a placeholder.
const ASSIGNED = /\b(?:api[_-]?key|secret(?:[_-]?key)?|access[_-]?token|auth[_-]?token)\b["']?\s*[:=]\s*["']([^"'\s]{20,})["']/gi;

export function secretKeyIn(text, { inPage = false } = {}) {
  const t = String(text || "");
  if (SECRET_KEYS.some((re) => re.test(t))) return "a secret key";
  if (!inPage && GOOGLE_KEY.test(t)) return "a secret key";
  for (const m of t.matchAll(ASSIGNED)) {
    if (!/your|example|xxxx|<|\$\{|process\.env|placeholder|replace/i.test(m[1])) return "a secret key";
  }
  return "";
}

export function privateInfoIn(text) {
  const t = String(text || "");
  for (const m of t.matchAll(/\d(?:[ -]?\d){12,18}/g)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 19 && !/^(\d)\1+$/.test(digits) && luhn(digits)) return "a card number";
  }
  if (secretKeyIn(t)) return "a secret key";
  if (/\b(?:my\s+)?(?:password|passcode|pin\s*code|login)\s*(?:is|:|=)\s*\S{4,}/i.test(t)) return "a password";
  if (/(?:^|[^\d])(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d)/.test(t)) return "a phone number";
  // "I live at 42 Maple Street", "my address is …": a house number and street, or saying so.
  if (/\b(?:i live at\s+\d|my (?:home )?address is\b|my house is at\s+\d)/i.test(t)) return "a home address";
  if (/\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Court|Ct|Way|Place|Pl|Terrace|Crescent|Close)\b\.?/.test(t)) return "a home address";
  return "";
}

// Publishing a website: its visible words (not scripts or styles), checked for the things that
// never belong on a public page, a card number or a written-out password (and its whole code
// for a secret key). A phone number isn't
// flagged there: a business showing its own is normal. -> what was found, or "".
export function privateInfoOnPage(html, parse = (h) => new DOMParser().parseFromString(h, "text/html")) {
  try {
    // A key anywhere in the page, scripts included: anyone can read a page's code.
    if (secretKeyIn(html, { inPage: true })) return "a secret key (like an API key)";
    const doc = parse(String(html || ""));
    for (const el of doc.querySelectorAll("script, style, noscript, template")) el.remove();
    const found = privateInfoIn(doc.body ? doc.body.textContent : "");
    return found === "a phone number" ? "" : found;
  } catch {
    return "";
  }
}
