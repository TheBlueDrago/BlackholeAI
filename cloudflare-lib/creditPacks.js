// One-time credit packs: bought instead of a plan (whatever the plan), added to the buyer's
// bonus balance (credits.js), and never reset at the end of the month. Every AI comes in
// the same sizes. The Base44 create-checkout function holds the authoritative prices, so keep
// PACK_PRICES in step with its copy. Payments can't be under $0.50, so the small packs start there.
export const PACK_SIZES = [5, 10, 25, 50];
export const PACK_PRICES = {
  ai: { 5: "0.50", 10: "0.60", 25: "0.80", 50: "1.00" },
  aiCode: { 5: "0.50", 10: "0.75", 25: "1.00", 50: "1.75" },
  galaxy5: { 5: "0.50", 10: "0.75", 25: "1.00", 50: "1.75" },
  space5: { 5: "0.50", 10: "0.75", 25: "1.00", 50: "1.75" },
};
// Product ids: credits-<ai>-<size>, e.g. "credits-galaxy-25".
const SLUG = { ai: "ai", aiCode: "code", galaxy5: "galaxy", space5: "space" };

export const CREDIT_PACKS = {};
for (const [tier, prices] of Object.entries(PACK_PRICES)) {
  for (const size of PACK_SIZES) CREDIT_PACKS[`credits-${SLUG[tier]}-${size}`] = { tier, credits: size, price: prices[size] };
}
// At most this many packs in one purchase.
export const MAX_PACKS = 10;
// The size a pack picker starts on.
export const DEFAULT_PACK_SIZE = 25;

// -> [[productId, pack], ...] for a credit tier, smallest first.
export const packsForTier = (tier) => Object.entries(CREDIT_PACKS).filter(([, p]) => p.tier === tier);
