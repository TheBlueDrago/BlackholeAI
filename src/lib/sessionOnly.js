// "Remember me" unticked at sign-in: stay signed in only until the browser is closed (think of
// a shared school computer). Base44 keeps the sign-in token in localStorage, which outlives
// the browser, so a session cookie (no expiry date: browsers drop it when they close) marks
// the browser session. If the flag is set and that cookie is gone, the browser was closed in
// between, so the saved sign-in is removed before the app reads it (src/lib/app-params.js).
export const FLAG = "bh-forget-on-close";
export const COOKIE = "bh_session";
const TOKEN_KEYS = ["base44_access_token", "token"];

export const hasSessionCookie = (cookies) => String(cookies || "").split(";").some((c) => c.trim().startsWith(`${COOKIE}=`));

// At sign-in: `sessionOnly` true when "Remember me" is unticked.
export function markSessionOnly(sessionOnly, storage = globalThis.localStorage, doc = globalThis.document) {
  try {
    if (sessionOnly) {
      storage.setItem(FLAG, "1");
      doc.cookie = `${COOKIE}=1; path=/; SameSite=Lax; Secure`;
    } else {
      storage.removeItem(FLAG);
    }
  } catch {
    // Storage or cookies blocked: nothing to remember either way.
  }
}

// At start-up. -> true when it signed the browser out.
export function forgetIfBrowserWasClosed(storage = globalThis.localStorage, cookies = globalThis.document && globalThis.document.cookie) {
  try {
    if (storage.getItem(FLAG) !== "1" || hasSessionCookie(cookies)) return false;
    for (const k of TOKEN_KEYS) storage.removeItem(k);
    storage.removeItem(FLAG);
    return true;
  } catch {
    return false;
  }
}
