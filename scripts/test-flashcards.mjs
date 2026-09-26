// Offline test for chat flashcards (src/lib/flashcards.js). Run: node scripts/test-flashcards.mjs
import { parseFlashcards, wantsFlashcards, FLASHCARD_NOTE } from "../src/lib/flashcards.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
assert(wantsFlashcards("Make flashcards") && wantsFlashcards("flash cards about WW2 please") && !wantsFlashcards("what is a flash drive"), "asking for flashcards is noticed");
assert(/```|code block/.test(FLASHCARD_NOTE) && /"flashcards"/.test(FLASHCARD_NOTE), "the AI is told the format");
const cards = parseFlashcards("Q: What is H2O?\nA: Water\n\nQ: Capital of France?\nA: Paris\n1. Question: 2+2?\nAnswer: 4\nQ: No answer here");
assert(cards.length === 3 && cards[0].q === "What is H2O?" && cards[1].a === "Paris" && cards[2].q === "2+2?" && cards[2].a === "4", "Q/A pairs become cards; one without an answer is left out");
assert(parseFlashcards("Q: Long?\nA: first line\nsecond line")[0].a === "first line second line", "an answer can run over two lines");
assert(parseFlashcards("just some text").length === 0, "not cards: none (shown as plain text)");
