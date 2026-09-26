// While a new version goes live (it takes a minute or two), an open page can ask for code files
// of the version before, which are gone. That shows up as these errors, in Chrome, Safari and
// Firefox. They're fixed by reloading, so the crash screen does that by itself
// (components/ErrorBoundary.jsx), at most MAX times in WINDOW_MS so it can never loop forever.
const UPDATE_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading (CSS )?chunk \d+ failed|Failed to load module script|MIME type/i;
export const isUpdateError = (err) => UPDATE_ERROR.test(String((err && (err.message || err)) || ""));

const KEY = "bh-update-reloads";
const MAX = 4;
const WINDOW_MS = 3 * 60 * 1000;

export function mayAutoReload(now = Date.now(), store = globalThis.sessionStorage) {
  try {
    const recent = (JSON.parse(store?.getItem(KEY) || "[]") || []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX) return false;
    store?.setItem(KEY, JSON.stringify([...recent, now]));
    return true;
  } catch {
    return false;
  }
}
