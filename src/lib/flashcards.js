// Flashcards in the chat: when someone asks for flashcards, the AI is told to answer with a
// ```flashcards block of "Q: … / A: …" pairs, which components/chat/Flashcards.jsx shows as
// cards to flip through.
export const wantsFlashcards = (text) => /\bflash ?cards?\b/i.test(String(text || ""));

export const FLASHCARD_NOTE =
  "[The user wants flashcards. Reply with one short sentence, then a code block whose language is " +
  "\"flashcards\", containing 5 to 12 cards, each written as a line \"Q: question\" followed by a line " +
  "\"A: short answer\". Nothing else inside the block.]\n\n";

// -> [{ q, a }] (cards missing a question or an answer are left out; at most 50)
export function parseFlashcards(src) {
  const cards = [];
  let cur = null;
  for (const raw of String(src || "").split("\n")) {
    const line = raw.trim();
    const q = /^(?:\d+[.)]\s*)?(?:Q|Question)\s*[:.-]\s*(.+)$/i.exec(line);
    const a = /^(?:A|Answer)\s*[:.-]\s*(.+)$/i.exec(line);
    if (q) {
      if (cur && cur.a) cards.push(cur);
      cur = { q: q[1].trim(), a: "" };
    } else if (a && cur) {
      cur.a = cur.a ? `${cur.a} ${a[1].trim()}` : a[1].trim();
    } else if (line && cur && cur.a) {
      cur.a += ` ${line}`;
    }
  }
  if (cur && cur.a) cards.push(cur);
  return cards.slice(0, 50);
}
