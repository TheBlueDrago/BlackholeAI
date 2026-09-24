// Before a message goes to the AI from the main chat: does it look like something people
// (often young ones) shouldn't share with an AI or anyone online? A card number (checked with
// the Luhn sum, so random long numbers don't count), a password written out, or a phone number.
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

export function privateInfoIn(text) {
  const t = String(text || "");
  for (const m of t.matchAll(/\d(?:[ -]?\d){12,18}/g)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 19 && !/^(\d)\1+$/.test(digits) && luhn(digits)) return "a card number";
  }
  if (/\b(?:my\s+)?(?:password|passcode|pin\s*code|login)\s*(?:is|:|=)\s*\S{4,}/i.test(t)) return "a password";
  if (/(?:^|[^\d])(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?!\d)/.test(t)) return "a phone number";
  return "";
}

// Publishing a website: its visible words (not scripts or styles), checked for the things that
// never belong on a public page, a card number or a written-out password. A phone number isn't
// flagged there: a business showing its own is normal. -> what was found, or "".
export function privateInfoOnPage(html, parse = (h) => new DOMParser().parseFromString(h, "text/html")) {
  try {
    const doc = parse(String(html || ""));
    for (const el of doc.querySelectorAll("script, style, noscript, template")) el.remove();
    const found = privateInfoIn(doc.body ? doc.body.textContent : "");
    return found === "a phone number" ? "" : found;
  } catch {
    return "";
  }
}
