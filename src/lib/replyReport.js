// "Report this reply" in the chat: what's sent to Monitor → Messages (contact topic "ai").
// The server keeps up to 2,000 characters of a message, so the question and reply are cut to
// fit, keeping the start of each.
export const REPLY_REASONS = [
  ["harmful", "Harmful or unsafe"],
  ["wrong", "Wrong or made up"],
  ["other", "Something else"],
];

const clip = (s, n) => {
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

export function replyReportMessage(reason, note, question, reply) {
  const label = (REPLY_REASONS.find(([k]) => k === reason) || REPLY_REASONS[2])[1];
  const parts = [`Reported AI reply: ${label}`];
  const extra = clip(note, 300);
  if (extra) parts.push(`Note: ${extra}`);
  parts.push(`Question: ${clip(question, 400) || "(none)"}`);
  parts.push(`Reply: ${clip(reply, 1100) || "(empty)"}`);
  return parts.join("\n\n");
}
