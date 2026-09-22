// Credits are whole numbers and scale with how much work the AI actually did:
// 1 credit per started CHARS_PER_CREDIT characters of output, minimum 1.
// A question or a small edit costs 1; a full website or game (up to Gemini's
// 8192-token output cap, ~32k characters) costs up to about 4.
// Charged after a successful reply, so failed or stopped requests cost nothing.
export const CHARS_PER_CREDIT = 10000;

export function creditsFor(output) {
  return Math.max(1, Math.ceil(String(output || "").length / CHARS_PER_CREDIT));
}

export const OUT_OF_CREDITS_NOTE =
  "⚠ You've run out of credits, so this reply was stopped partway through. Chat is paused until you get more credits.";

// Fits a reply to the credits left. When the full reply costs more than the user
// has, it's cut off at the point their remaining credits cover and they're charged
// exactly what's left (which pauses the chat, since they're then at 0).
export function fitToCredits(content, remaining) {
  const text = String(content || "");
  const cost = creditsFor(text);
  const left = Number.isFinite(remaining) ? Math.max(0, Math.floor(remaining)) : Infinity;
  if (cost <= left) return { content: text, cost, cut: false };
  return { content: text.slice(0, left * CHARS_PER_CREDIT), cost: left, cut: true };
}
