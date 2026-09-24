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

// The page colour under everything, per theme (the light theme's slate-950 is #f8fafc). Kept
// on <body> so nothing white or black shows through while a page loads.
export const THEME_BG = { dark: "#020617", light: "#f8fafc" };
// The theme last used on this device: index.html applies it before the app starts, so opening
// the app doesn't flash dark, then light (or the other way round).
export const DEVICE_THEME_KEY = "bh-theme";

export function applyThemeClass(light) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (light) el.classList.add("light");
  else el.classList.remove("light");
  if (document.body) document.body.style.background = light ? THEME_BG.light : THEME_BG.dark;
  try {
    localStorage.setItem(DEVICE_THEME_KEY, light ? "light" : "dark");
  } catch {}
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