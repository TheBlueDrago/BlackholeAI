// Offline test: which parts of an AI reply are shown as math formulas (src/lib/mathText.js).
// Run: node scripts/test-math.mjs
import { prepareMath } from "../src/lib/mathText.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const p = (t) => prepareMath(t);

assert(!p("Pro is $2.99 a month and Team is $7.99.").hasMath && p("It costs $5 or $10").text === "It costs $5 or $10", "prices stay prices");
assert(p("Solve $x^2 - 5x + 6 = 0$ first.").text === "Solve $$x^2 - 5x + 6 = 0$$ first.", "an equation in $ becomes math");
assert(p("Let $x$ be the width.").text === "Let $$x$$ be the width." && p("so $a + b$ is").hasMath, "single letters and simple sums");
assert(p("Half is $\\frac{1}{2}$.").text === "Half is $$\\frac{1}{2}$$.", "LaTeX commands");
assert(p("Then \\(a^2+b^2=c^2\\) holds").text === "Then $$a^2+b^2=c^2$$ holds", "\\( \\) inline math");
assert(p("Area:\n\\[ A = \\pi r^2 \\]\nDone").text === "Area:\n\n$$\nA = \\pi r^2\n$$\n\nDone", "\\[ \\] display math");
assert(p("$$\nE = mc^2\n$$").hasMath && p("$$\nE = mc^2\n$$").text === "$$\nE = mc^2\n$$", "$$ blocks kept as they are");
assert(p("```js\nconst s = `$x^2$`;\n```").text === "```js\nconst s = `$x^2$`;\n```" && !p("```js\nconst s = `$x^2$`;\n```").hasMath, "code blocks untouched");
assert(p("Use `$HOME` and `$x^2$` in a shell").text === "Use `$HOME` and `$x^2$` in a shell", "inline code untouched");
assert(!p("Save $ 5 = nothing $").hasMath, "$ with spaces inside isn't math");
assert(!p("No math here at all.").hasMath, "plain text");

const { mathToWords } = await import("../src/lib/mathText.js");
assert(mathToWords("So $x^2 = 9$.") === "So  x squared equals 9 .", "read aloud: powers and equals as words");
assert(mathToWords("Half is $\\frac{1}{2}$").includes("1 over 2") && mathToWords("$\\sqrt{25}$").includes("the square root of 25"), "read aloud: fractions and roots");
assert(mathToWords("$x = 5 \\pm 1$").includes("plus or minus") && mathToWords("It's $5 or $10") === "It's $5 or $10", "read aloud: ± as words, prices untouched");
