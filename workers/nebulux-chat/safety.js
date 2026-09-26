// What Nebulux Chat lets through. It's used by kids, so messages can't carry personal info
// (phone numbers, email or home addresses), links to other websites (scams, adult sites) or
// bad words. Personal info and links are taken out; a message that's mostly bad words is refused.

const BAD = [
  "fuck", "shit", "bitch", "bastard", "asshole", "dick", "pussy", "cunt", "slut", "whore", "fag", "faggot",
  "nigger", "nigga", "retard", "porn", "sex", "nude", "nudes", "kys", "kill yourself",
];
const BAD_RE = new RegExp(`\\b(${BAD.map((w) => w.replace(/ /g, "\\s+")).join("|")})\\w*`, "gi");
const PHONE = /(\+?\d[\s().-]?){0,2}\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const ADDRESS = /\b\d{1,5}\s+(?:[A-Za-z]+\s){0,3}(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|boulevard|blvd|way|place|pl)\b\.?/gi;
const LINK = /\b((?:https?:\/\/|www\.)[^\s<]+|[a-z0-9-]+\.(?:com|net|org|io|gg|xyz|ru|co|me|tv|app|dev)(?:\/[^\s<]*)?)/gi;
const OURS = /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)?(nebuluxai\.com|blackhole-ai-tech\.com)(?:[/?#].*)?$/i;

export const MAX_LEN = 2000;

// -> { text, removed: [...] } or { error }
export function cleanMessage(raw) {
  let text = String(raw || "").replace(/\r/g, "").trim();
  if (!text) return { error: "Type a message first." };
  if (text.length > MAX_LEN) return { error: `Keep messages under ${MAX_LEN} characters.` };
  const removed = [];
  const words = text.split(/\s+/).length;
  const bad = (text.match(BAD_RE) || []).length;
  if (bad && bad / words > 0.4) return { error: "That message has words that aren't allowed here. Keep it kind." };
  text = text.replace(BAD_RE, (m) => {
    removed.push("bad word");
    return "*".repeat(Math.min(m.length, 6));
  });
  text = text.replace(EMAIL, () => {
    removed.push("email address");
    return "[email removed]";
  });
  text = text.replace(PHONE, (m) => {
    if (m.replace(/\D/g, "").length < 10) return m;
    removed.push("phone number");
    return "[phone number removed]";
  });
  text = text.replace(ADDRESS, () => {
    removed.push("address");
    return "[address removed]";
  });
  text = text.replace(LINK, (m) => {
    if (OURS.test(m)) return m;
    removed.push("link");
    return "[link removed]";
  });
  return { text, removed: [...new Set(removed)] };
}

// Display names: 2-24 letters, digits, spaces, _ . - ; nothing official-looking or rude.
export function cleanName(raw) {
  const n = String(raw || "").replace(/\s+/g, " ").trim();
  if (n.length < 2 || n.length > 24) return { error: "Names are 2 to 24 characters." };
  if (!/^[\p{L}\p{N} _.-]+$/u.test(n)) return { error: "Use letters, numbers, spaces, _ . or - in your name." };
  if (/nebulux|blackhole|admin|moderator|staff|official|support/i.test(n)) return { error: "That name looks official, so it isn't allowed." };
  BAD_RE.lastIndex = 0;
  if (BAD_RE.test(n)) return { error: "That name isn't allowed." };
  return { name: n };
}
