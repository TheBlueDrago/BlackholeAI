// A chat's name in the sidebar, from its first message. Made here rather than by asking the AI,
// so it's instant and doesn't use up the free AI's requests (which made "very busy" likelier).
const FILLER = /^(hey|hi|hello|yo|ok|okay|so|um|please|pls|can you|could you|would you|will you|i need you to|i want you to|help me|tell me|explain to me)\b[\s,!.:-]*/i;

export function chatTitle(text, max = 40) {
  let t = String(text || "")
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (let i = 0; i < 3 && FILLER.test(t); i++) t = t.replace(FILLER, "");
  t = t.replace(/[?!.,:;\s]+$/, "");
  if (!t) return "New chat";
  if (t.length > max) {
    const cut = t.slice(0, max + 1);
    const space = cut.lastIndexOf(" ");
    t = `${(space > max * 0.5 ? cut.slice(0, space) : cut.slice(0, max)).replace(/[,:;\s-]+$/, "")}…`;
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}
