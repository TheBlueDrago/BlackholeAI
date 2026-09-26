// One-time credit packs: bought instead of a plan (whatever the plan), added to the buyer's
// bonus balance (credits.js), and never reset at the end of the month. Every AI comes in
// the same sizes. The Base44 create-checkout function holds the authoritative prices, so keep
// PACK_PRICES in step with its copy.
//
// Priced against the plans (2026-09-25): every 50-credit pack costs less than Pro ($10 for
// 100 AI + 50 each of Code, Galaxy and Space), and buying Pro's credits as packs costs about
// 2.5x Pro, so a plan is the better deal and packs are for topping up. Bigger packs cost less
// per credit. No pack is under the $0.50 payment minimum (so there's no 5-credit pack: it
// would cost the same as 10).
export const PACK_SIZES = [10, 25, 50];
export const PACK_PRICES = {
  ai: { 10: "0.50", 25: "0.69", 50: "0.99" },
  aiCode: { 10: "0.55", 25: "0.89", 50: "1.49" },
  galaxy5: { 10: "0.59", 25: "1.19", 50: "1.99" },
  space5: { 10: "0.75", 25: "1.49", 50: "2.49" },
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
