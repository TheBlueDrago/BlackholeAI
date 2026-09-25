// Offline test for "About you" (src/lib/aboutMe.js). Run: node scripts/test-about-me.mjs
import { readAboutMe, saveAboutMe, aboutMeBlock, ABOUT_MAX } from "../src/lib/aboutMe.js";

let failed = 0;
const assert = (c, m) => {
  console.log((c ? "ok " : "FAIL ") + m);
  if (!c) failed++;
};
const m = new Map();
const store = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };

assert(readAboutMe("u1", store) === "" && aboutMeBlock("") === "", "nothing saved: nothing is sent");
saveAboutMe("u1", "  I'm in 7th grade.  ", store);
assert(readAboutMe("u1", store) === "I'm in 7th grade." && readAboutMe("u2", store) === "", "saved for that account only, trimmed");
assert(aboutMeBlock("I'm in 7th grade.").includes("I'm in 7th grade.") && aboutMeBlock("x").endsWith("\n\n"), "it's sent as a note before the conversation");
saveAboutMe("u1", "x".repeat(ABOUT_MAX + 50), store);
assert(readAboutMe("u1", store).length === ABOUT_MAX, `capped at ${ABOUT_MAX} characters`);
saveAboutMe("u1", "", store);
assert(readAboutMe("u1", store) === "" && !m.has("bh-about-me:u1"), "clearing removes it");
assert(readAboutMe("u1", { getItem: () => { throw new Error("blocked"); } }) === "", "blocked storage doesn't break the chat");

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
