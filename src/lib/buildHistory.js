// Earlier builds of the Website Designer's current project, kept in IndexedDB so
// "Restore" still works after a reload. localStorage only keeps the newest build (older
// copies blew its ~5 MB quota); IndexedDB allows far more. Only one project is kept,
// under a single key, so this never grows past MAX_BUILDS pages.
import { run as runIn } from "./designerDb";

const KEY = "current";
export const MAX_BUILDS = 20;
const run = (mode, fn) => runIn("builds", mode, fn);

// builds: every build's HTML in order (oldest first). Keeps the newest MAX_BUILDS.
export async function saveBuilds(projectId, builds) {
  const total = builds.length;
  await run("readwrite", (s) => s.put({ projectId, total, list: builds.slice(-MAX_BUILDS) }, KEY));
}

// Returns the HTML of build number k (0-based, oldest first) for this project, as a
// function, or null when nothing is stored for it.
export async function loadBuilds(projectId) {
  const rec = await run("readonly", (s) => s.get(KEY));
  if (!rec || rec.projectId !== projectId) return null;
  const first = rec.total - rec.list.length;
  return { total: rec.total, get: (k) => (k >= first && k < rec.total ? rec.list[k - first] : "") };
}
