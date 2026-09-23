// Earlier builds of the Website Designer's current project, kept in IndexedDB so
// "Restore" still works after a reload. localStorage only keeps the newest build (older
// copies blew its ~5 MB quota); IndexedDB allows far more. Only one project is kept,
// under a single key, so this never grows past MAX_BUILDS pages.
import { run as runIn } from "./designerDb";

const KEY = "current";
export const MAX_BUILDS = 20;
const run = (mode, fn) => runIn("builds", mode, fn);

// builds: every build's HTML in order (oldest first). Keeps the newest MAX_BUILDS.
// `slot` keeps the Website and Game Designers' histories apart.
export async function saveBuilds(projectId, builds, slot = KEY) {
  const total = builds.length;
  await run("readwrite", (s) => s.put({ projectId, total, list: builds.slice(-MAX_BUILDS) }, slot));
}

// Returns the HTML of build number k (0-based, oldest first) for this project, as a
// function, or null when nothing is stored for it.
export async function loadBuilds(projectId, slot = KEY) {
  const rec = await run("readonly", (s) => s.get(slot));
  if (!rec || rec.projectId !== projectId) return null;
  const first = rec.total - rec.list.length;
  return { total: rec.total, get: (k) => (k >= first && k < rec.total ? rec.list[k - first] : "") };
}

// Only the newest build keeps its HTML in localStorage (older copies blow its ~5 MB
// quota and saves then fail silently); older ones keep just their note.
export function trimForStorage(messages, isHtmlMsg) {
  let kept = false;
  return [...messages]
    .reverse()
    .map((m) => {
      if (!isHtmlMsg(m)) return m;
      if (kept) return { role: "ai", content: "", note: m.note || "", built: true };
      kept = true;
      return m;
    })
    .reverse();
}
