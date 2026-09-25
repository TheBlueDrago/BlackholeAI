// Messages from forms on published sites (bookings, RSVPs, sign-ups, contact forms), kept for
// the site's owner. The page sends them with the script from pageserve.js withFormInbox;
// functions/.../site-form.js receives them. Stored in KV "inbox:<site>" (newest first).
//
// Kept small and safe: never anything that looks like a password, card or ID number (a site
// can't use this to phish), size and count limits, a trap field only bots fill in, and caps
// per visitor and per site per day (KV's free tier allows 1,000 writes a day in total).
export const MAX_FIELDS = 20;
export const MAX_LABEL = 60;
export const MAX_VALUE = 1000;
export const KEEP = 200; // messages kept per site
export const PER_SITE_PER_DAY = 50;

const SECRET = /pass(word|code)?|pwd|pin\b|card|cc-?num|cvv|cvc|security.?code|ssn|social.?security|routing|iban|account.?num|seed|recovery.?phrase|private.?key/i;
const CARDISH = /^\D*(\d[\s-]?){13,19}\D*$/;

export const inboxKey = (site) => `inbox:${site}`;

// [[label, value], ...] -> the fields worth keeping, or null if there's nothing to keep.
export function cleanFields(fields) {
  if (!Array.isArray(fields)) return null;
  const out = [];
  for (const f of fields.slice(0, MAX_FIELDS)) {
    if (!Array.isArray(f)) continue;
    const label = String(f[0] ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_LABEL) || "Field";
    const value = String(f[1] ?? "").trim().slice(0, MAX_VALUE);
    if (!value || SECRET.test(label) || CARDISH.test(value)) continue;
    out.push([label, value]);
  }
  return out.length ? out : null;
}

async function read(kv, site) {
  try {
    return (await kv.get(inboxKey(site), "json")) || [];
  } catch {
    return [];
  }
}

// -> { ok } or { error }
export async function addMessage(kv, site, fields, now = new Date()) {
  const list = await read(kv, site);
  const today = now.toISOString().slice(0, 10);
  if (list.filter((m) => String(m.at).startsWith(today)).length >= PER_SITE_PER_DAY) return { error: "This site has had a lot of messages today. Please try again tomorrow." };
  const msg = { id: crypto.randomUUID(), at: now.toISOString(), fields };
  await kv.put(inboxKey(site), JSON.stringify([msg, ...list].slice(0, KEEP)));
  return { ok: true };
}

export const listMessages = (kv, site) => read(kv, site);

export async function removeMessage(kv, site, id) {
  const list = await read(kv, site);
  const next = id ? list.filter((m) => m.id !== id) : [];
  if (next.length !== list.length) await kv.put(inboxKey(site), JSON.stringify(next));
  return next;
}
