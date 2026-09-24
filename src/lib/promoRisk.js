// Monitor → Promo codes: codes worth a second look before they go live, because anyone who
// finds or guesses the code can use them. -> the question to confirm, or "" when it's fine.
export function promoWarning(f) {
  const code = String(f.code || "").trim() || "This code";
  if (f.kind === "discount") {
    const pct = Number(f.pct) || 0;
    const limit = Math.max(0, Math.trunc(Number(f.maxUses)) || 0);
    const who = limit ? `up to ${limit} ${limit === 1 ? "person" : "people"}` : "anyone who has the code, with no use limit";
    if (pct >= 100) return `${code} makes it free for ${who}. Create it?`;
    if (pct >= 50 && !limit) return `${code} gives ${pct}% off to ${who}. Create it?`;
    return "";
  }
  const credits = Number(f.credits) || 0;
  return credits >= 200 ? `${code} gives ${credits} credits to whoever redeems it first. Create it?` : "";
}
