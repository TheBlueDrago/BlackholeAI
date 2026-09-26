// Offline test for tap-to-answer quizzes in the chat (src/lib/quiz.js). Run: node scripts/test-quiz.mjs
import { parseQuiz, wantsQuiz, QUIZ_NOTE } from "../src/lib/quiz.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
assert(wantsQuiz("Quiz me on this") && wantsQuiz("give me a quiz about fractions") && wantsQuiz("make a multiple-choice test") && !wantsQuiz("what is a quiz show"), "asking for a quiz is noticed");
assert(/"quiz"/.test(QUIZ_NOTE) && /Answer: letter/.test(QUIZ_NOTE), "the AI is told the format");
const qs = parseQuiz(`Q: What is 2+2?
A) 3
B) 4
C) 5
D) 22
Answer: B
Why: Two plus two makes four.

Q: Capital of France?
A) Paris
B) Rome
Answer: a

Q: Broken one with no answer
A) x
B) y`);
assert(qs.length === 2, "good questions kept, one without an answer left out");
assert(qs[0].q === "What is 2+2?" && qs[0].options.length === 4 && qs[0].answer === 1 && qs[0].why === "Two plus two makes four.", "question, options, answer and reason read");
assert(qs[1].answer === 0 && qs[1].options.join() === "Paris,Rome", "lowercase answer letters and 2 options work");
assert(parseQuiz("no quiz here").length === 0, "not a quiz: none (shown as text)");
