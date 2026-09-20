export const GAME_DESIGNER_STORE_KEY = "infinity-ai-game-designer";

export function genGameProjectId() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
}

// Loads a game (e.g. a built-in template) into the active Games Designer project so it opens ready to publish.
export function loadGameIntoDesigner({ gameName, title = "", genre = "io", html }) {
  localStorage.setItem(
    GAME_DESIGNER_STORE_KEY,
    JSON.stringify({
      gameName,
      title,
      genre,
      messages: html ? [{ role: "ai", content: html }] : [],
      projectId: genGameProjectId(),
    })
  );
}
