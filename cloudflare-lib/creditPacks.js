// One-time credit packs: bought instead of a plan, added to the buyer's bonus balance
// (credits.js), and never reset at the end of the month. The Base44 create-checkout function
// holds the authoritative prices, so keep these in step with its CREDIT_PACKS.
export const CREDIT_PACKS = {
  "credits-ai": { tier: "ai", credits: 50, price: "1.00" },
  "credits-code": { tier: "aiCode", credits: 25, price: "1.00" },
  "credits-galaxy": { tier: "galaxy5", credits: 25, price: "1.00" },
  "credits-space": { tier: "space5", credits: 25, price: "1.00" },
};
// At most this many packs in one purchase.
export const MAX_PACKS = 10;

// -> [productId, pack] for a credit tier.
export const packForTier = (tier) => Object.entries(CREDIT_PACKS).find(([, p]) => p.tier === tier) || null;
