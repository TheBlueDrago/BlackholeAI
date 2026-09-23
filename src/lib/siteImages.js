// Images for Website Designer sites. Attached images are shrunk in the browser and
// kept in IndexedDB; the site's HTML (and so the AI prompt, the chat and the saved
// project) only holds short placeholders like src="bhimg:1a2b3c4d". expandImages()
// swaps the real images (data: URLs) in for the preview, publishing, download and
// GitHub, so a published page is self-contained and nothing is stored on the server.
import { run } from "./designerDb";

const MAX_SIDE = 1600;
const MAX_KEEP = 80; // images kept in IndexedDB (oldest dropped)
const PLACEHOLDER = /bhimg:([0-9a-f]{8})/g;
const DATA_URL = /data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]{200,}/g;

const images = new Map(); // id -> data URL, for this tab
let listeners = [];

async function idFor(dataUrl) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dataUrl));
  return [...new Uint8Array(buf)].slice(0, 4).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function remember(id, dataUrl) {
  if (images.get(id) === dataUrl) return;
  images.set(id, dataUrl);
  run("images", "readwrite", (s) => s.put({ dataUrl, at: Date.now() }, id)).catch(() => {});
  listeners.forEach((fn) => fn());
}

// Loads saved images into memory (call once when the designer opens) and drops the
// oldest beyond MAX_KEEP.
export async function loadImages() {
  try {
    const keys = await run("images", "readonly", (s) => s.getAllKeys());
    const vals = await run("images", "readonly", (s) => s.getAll());
    const rows = keys.map((k, i) => [k, vals[i]]).sort((a, b) => (b[1]?.at || 0) - (a[1]?.at || 0));
    rows.slice(0, MAX_KEEP).forEach(([k, v]) => v?.dataUrl && !images.has(k) && images.set(k, v.dataUrl));
    const old = rows.slice(MAX_KEEP).map(([k]) => k);
    if (old.length) await run("images", "readwrite", (s) => old.forEach((k) => s.delete(k)));
  } catch {
    // No IndexedDB (private mode etc.): images still work until the tab closes.
  }
  listeners.forEach((fn) => fn());
}

// Re-render hook for components that show expanded HTML.
export function onImagesChange(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}

// Shrinks an image file (longest side MAX_SIDE) and returns its placeholder id.
export async function addImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`${file.name} isn't an image this browser can open.`));
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    // PNGs may be transparent (logos); photos compress far better as JPEG.
    const dataUrl = file.type === "image/png" || file.type === "image/gif" || file.type === "image/webp"
      ? canvas.toDataURL("image/webp", 0.85)
      : canvas.toDataURL("image/jpeg", 0.82);
    const id = await idFor(dataUrl);
    remember(id, dataUrl);
    return id;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Real images in place of placeholders. Unknown placeholders are left as they are.
export function expandImages(html) {
  if (!html || !html.includes("bhimg:")) return html;
  return html.replace(PLACEHOLDER, (m, id) => images.get(id) || m);
}

// Placeholders in place of embedded images (e.g. a published site opened for editing),
// so they don't bloat the AI prompt and the saved project.
export async function packImages(html) {
  if (!html || !html.includes(";base64,")) return html;
  const found = html.match(DATA_URL) || [];
  const ids = new Map();
  for (const d of new Set(found)) {
    const id = await idFor(d);
    remember(id, d);
    ids.set(d, id);
  }
  return html.replace(DATA_URL, (d) => `bhimg:${ids.get(d)}`);
}
