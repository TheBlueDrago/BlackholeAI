// Loaded only when a reply has math (components/chat/Markdown.jsx), so KaTeX and its fonts
// don't slow the app down for everyone else. KaTeX's defaults keep \href and HTML off.
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Only $$…$$ is math: lib/mathText.js turns math-looking $…$ into that, so prices stay prices.
export const remarkMathPlugin = [remarkMath, { singleDollarTextMath: false }];
export const rehypeKatexPlugin = [rehypeKatex, { throwOnError: false, strict: "ignore", output: "htmlAndMathml" }];
