// Study mode (chat toolbar): the AI tutors instead of handing over answers. Saved on this
// device; the note goes before the conversation, like "About you" (lib/aboutMe.js).
const KEY = "bh-study-mode";
const listeners = new Set();

export function studyModeOn(store = globalThis.localStorage) {
  try {
    return store?.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setStudyMode(on, store = globalThis.localStorage) {
  try {
    if (on) store?.setItem(KEY, "1");
    else store?.removeItem(KEY);
  } catch {
    // Storage blocked: it lasts until the page closes.
  }
  listeners.forEach((f) => f(!!on));
}

export const onStudyMode = (f) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

export const STUDY_NOTE =
  "[Study mode is on: the user wants to learn, not just get answers. Be a patient, encouraging tutor. " +
  "For a homework or practice question, don't give the final answer straight away: explain the idea briefly, " +
  "then guide them one step at a time and ask them to try the next step, with a hint if they're stuck. " +
  "Check their tries kindly and say what was right. Give the full answer only if they ask for it or have " +
  "tried a few times. Keep each reply short. For other messages, answer normally.]\n\n";

export const studyBlock = (on) => (on ? STUDY_NOTE : "");
