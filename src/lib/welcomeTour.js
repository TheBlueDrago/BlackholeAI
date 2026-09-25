// Who gets the welcome tour (components/WelcomeTour.jsx): accounts made in the last few days,
// once per account on this device, so people who already know the app aren't interrupted.
export const NEW_FOR_DAYS = 3;
const seenKey = (id) => `bh-welcome-tour:${id}`;

export function shouldOfferTour(user, now = Date.now(), storage = globalThis.localStorage) {
  if (!user || !user.id) return false;
  const raw = String(user.created_date || "");
  const made = Date.parse(/Z|[+-]\d\d:?\d\d$/.test(raw) ? raw : raw + "Z");
  if (!(now - made < NEW_FOR_DAYS * 86400000)) return false;
  try {
    return !storage.getItem(seenKey(user.id));
  } catch {
    return false;
  }
}

export function markTourSeen(id, storage = globalThis.localStorage) {
  try {
    storage.setItem(seenKey(id), new Date().toISOString());
  } catch {
    // Storage blocked: it may show again next time, which is harmless.
  }
}
