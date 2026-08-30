// Theme helpers: drive a `.light` class on <html> for a variable-based light/dark theme.
// Default (no class) is dark. A per-user preference overrides the OS prefers-color-scheme guess.

export const userThemeKey = (id) => `infinity-ai-light-${id}`;

export function prefersLight() {
  try {
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  } catch {
    return false;
  }
}

export function applyThemeClass(light) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (light) el.classList.add("light");
  else el.classList.remove("light");
}

export function readUserTheme(id) {
  if (!id) return null;
  try {
    const v = localStorage.getItem(userThemeKey(id));
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {}
  return null;
}

export function writeUserTheme(id, light) {
  if (!id) return;
  try {
    localStorage.setItem(userThemeKey(id), light ? "1" : "0");
  } catch {}
}