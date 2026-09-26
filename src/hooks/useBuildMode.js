import { useState, useEffect } from "react";

// Build/Discuss mode for the code-capable AIs. Resets to "build" whenever the AI changes,
// and is only shown when the selected AI isn't the plain Nebulux AI.
export default function useBuildMode(selectedAi) {
  const [mode, setMode] = useState("build");
  useEffect(() => {
    setMode("build");
  }, [selectedAi]);
  return { mode, setMode, visible: selectedAi !== "ai" };
}

const BUILD_VERBS =
  /\b(build|make|create|add|change|update|remove|delete|implement|write|fix|generate|code|design|edit|replace|redesign|improve|turn|put|set|move|resize|style|rename|convert|refactor|do it|go ahead|start)\b/i;
const QUESTION_START = /^(what|why|how|when|where|who|which|is|are|does|do|did|should|explain|tell me|describe)\b/i;
const REQUEST_PHRASE = /^(can|could|would|will) you\b|\bplease\b/i;

function isQuestion(text) {
  const t = text.trim();
  if (REQUEST_PHRASE.test(t)) return false;
  return t.endsWith("?") || QUESTION_START.test(t);
}

// Decide whether a message should trigger a build (credit cost is set by creditsFor
// in lib/creditCost.js once the reply is back).
// Build mode: builds unless the user is asking a question.
// Discuss mode: never builds unless the user explicitly asks to build.
export function resolveIntent(text, mode) {
  const question = isQuestion(text);
  const build = mode === "build" ? !question : !question && BUILD_VERBS.test(text);
  return { build };
}

export const BUILD_NOTE =
  "MODE: BUILD. Produce the complete, working result (code or document) the user asked for. " +
  "Start with one short friendly sentence confirming what you're building (e.g. \"Sure — here's a Python script that renames your files by date.\"). " +
  "Then briefly explain the parts it needs and what each one is for (e.g. \"We need this function to read the folder, and this part to parse the dates.\"). " +
  "Then give the FULL code in fenced code blocks — never partial snippets or placeholders like \"...rest of the code\". " +
  "Finish with a line or two on how to run or use it.";
export const ANSWER_NOTE =
  "MODE: ANSWER. The user is asking a question, not requesting a build. Answer it directly and concisely in plain conversational text; short illustrative snippets are fine, but do not produce a full build.";
export const DISCUSS_NOTE =
  "MODE: DISCUSS. Do NOT write or output any code or HTML. Talk with the user in plain conversational text: answer questions, explain, plan, and suggest ideas. Keep any existing work unchanged.";