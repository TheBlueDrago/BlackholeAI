import { useState, useEffect } from "react";

// Build/Discuss mode for the code-capable AIs. Resets to "build" whenever the AI changes,
// and is only shown when the selected AI isn't the plain Blackhole AI.
export default function useBuildMode(selectedAi) {
  const [mode, setMode] = useState("build");
  useEffect(() => {
    setMode("build");
  }, [selectedAi]);
  return { mode, setMode, visible: selectedAi !== "ai" };
}

export const BUILD_NOTE = "MODE: BUILD. Produce the complete, working result (code or document) the user asked for.";
export const DISCUSS_NOTE =
  "MODE: DISCUSS. Do NOT write or output any code or HTML. Talk with the user in plain conversational text: answer questions, explain, plan, and suggest ideas. Keep any existing work unchanged.";