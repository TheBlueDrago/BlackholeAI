// One-time credit packs: bought instead of a plan (whatever the plan), added to the buyer's
// bonus balance (credits.js), and never reset at the end of the month. Every AI comes in
// the same sizes. The Base44 create-checkout function holds the authoritative prices, so keep
// PACK_BASE and PACK_MULT in step with its copy.
//
// 5 credits cost the AI's base price. Doubling the pack doubles the price minus half of the
// smaller pack's price (10 = 1.5x, 50 = 1.5x the 25 pack), and 25 credits are 3x the base,
// so bigger packs cost less per credit.
export const PACK_SIZES = [5, 10, 25, 50];
// Half the first prices ($1/$2/$3/$4 for 5 credits), from 2026-09-25; 5 AI credits stays at the
// $0.50 payment minimum.
export const PACK_BASE = { ai: 0.5, aiCode: 1, galaxy5: 1.5, space5: 2 };
export const PACK_MULT = { 5: 1, 10: 1.5, 25: 3, 50: 4.5 };
export const PACK_PRICES = {};
for (const [tier, base] of Object.entries(PACK_BASE)) {
  PACK_PRICES[tier] = {};
  for (const size of PACK_SIZES) PACK_PRICES[tier][size] = (base * PACK_MULT[size]).toFixed(2);
}
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
