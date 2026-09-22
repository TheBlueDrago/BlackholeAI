// Credits are whole numbers and scale with how much work the AI actually did:
// 1 credit per started CHARS_PER_CREDIT characters of output, minimum 1.
// A question or a small edit costs 1; a full website or game (up to Gemini's
// 8192-token output cap, ~32k characters) costs up to about 4.
// Charged after a successful reply, so failed or stopped requests cost nothing.
export const CHARS_PER_CREDIT = 10000;

export function creditsFor(output) {
  return Math.max(1, Math.ceil(String(output || "").length / CHARS_PER_CREDIT));
}
