// Tap-to-answer quizzes in the chat: when someone asks to be quizzed, the AI is told to answer
// with a ```quiz block, which components/chat/Quiz.jsx turns into a quiz with a score.
export const wantsQuiz = (text) => /\b(quiz me|quiz on|give me a quiz|make (me )?a quiz|practice test|multiple[- ]choice|test me)\b/i.test(String(text || ""));

export const QUIZ_NOTE =
  "[The user wants a quiz. If the topic isn't clear from the message or the conversation, ask one short question about it first. " +
  "Otherwise reply with one short sentence, then a code block whose language is \"quiz\" with 5 multiple-choice questions at the " +
  "user's level, each written exactly like this, with a blank line between questions:\n" +
  "Q: question\nA) option\nB) option\nC) option\nD) option\nAnswer: letter\nWhy: one-sentence explanation\n" +
  "Nothing else inside the block.]\n\n";

// -> [{ q, options: [..], answer: index, why }] (malformed questions are left out; at most 30)
export function parseQuiz(src) {
  const out = [];
  let cur = null;
  const push = () => {
    if (cur && cur.q && cur.options.length >= 2 && cur.answer >= 0 && cur.answer < cur.options.length) out.push(cur);
  };
  for (const raw of String(src || "").split("\n")) {
    const line = raw.trim();
    let m;
    if ((m = /^(?:\d+[.)]\s*)?(?:Q|Question)\s*\d*\s*[:.]\s*(.+)$/i.exec(line))) {
      push();
      cur = { q: m[1].trim(), options: [], answer: -1, why: "" };
    } else if (cur && (m = /^([A-F])[).:]\s*(.+)$/.exec(line))) {
      cur.options["ABCDEF".indexOf(m[1])] = m[2].trim();
    } else if (cur && (m = /^(?:Answer|Correct(?: answer)?)\s*[:.-]\s*\(?([A-F])\b/i.exec(line))) {
      cur.answer = "ABCDEF".indexOf(m[1].toUpperCase());
    } else if (cur && (m = /^(?:Why|Explanation)\s*[:.-]\s*(.+)$/i.exec(line))) {
      cur.why = m[1].trim();
    }
  }
  push();
  return out.map((c) => ({ ...c, options: c.options.filter((o) => o !== undefined) })).slice(0, 30);
}
