export const DESIGNER_STORE_KEY = "infinity-ai-designer";

export function genProjectId() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
}

// Clears the active in-progress project so the builder starts from a blank site.
export function resetDesignerProject(siteName = "my-site") {
  localStorage.setItem(
    DESIGNER_STORE_KEY,
    JSON.stringify({ siteName, messages: [], members: [], projectId: genProjectId() })
  );
}

// Loads a previously published site's HTML back into the active project so it opens in the builder.
export function loadDesignerHtmlIntoProject(siteName, html) {
  localStorage.setItem(
    DESIGNER_STORE_KEY,
    JSON.stringify({
      siteName,
      messages: html ? [{ role: "ai", content: html }] : [],
      members: [],
      projectId: genProjectId(),
    })
  );
}
