// Offline test for Study mode (src/lib/studyMode.js). Run: node scripts/test-study-mode.mjs
import { studyModeOn, setStudyMode, onStudyMode, studyBlock, STUDY_NOTE } from "../src/lib/studyMode.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const m = new Map();
const store = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
let heard = null;
const off = onStudyMode((v) => (heard = v));
assert(!studyModeOn(store) && studyBlock(false) === "", "off by default: nothing extra is sent");
setStudyMode(true, store);
assert(studyModeOn(store) && heard === true, "turned on, saved, and the button hears it");
assert(studyBlock(true) === STUDY_NOTE && /one step at a time/.test(STUDY_NOTE) && /only if they ask/.test(STUDY_NOTE) && STUDY_NOTE.endsWith("\n\n"), "on: the AI is told to tutor, and give the answer if asked");
setStudyMode(false, store);
off();
assert(!studyModeOn(store) && !m.size, "turned off: removed");
assert(!studyModeOn({ getItem: () => { throw new Error("blocked"); } }), "blocked storage: just off");
