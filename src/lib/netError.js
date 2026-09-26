// A request that never got an answer (offline, or the connection dropped): fetch rejects with
// a TypeError and axios says "Network Error", with no response either way. Shown in plain
// words instead of "Failed to fetch".
export function isNetworkError(e, online = typeof navigator === "undefined" ? true : navigator.onLine) {
  if (e?.response) return false;
  if (online === false) return true;
  return e?.name === "TypeError" || /network ?error|failed to fetch|load failed|fetch failed/i.test(String(e?.message || ""));
}

export const OFFLINE_NOTE = "Couldn't reach Nebulux AI. You may be offline, or the connection dropped. Check your connection and try again.";
