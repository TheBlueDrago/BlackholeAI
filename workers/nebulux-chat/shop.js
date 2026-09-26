// Orbs: Nebulux Chat's rewards. Earned by chatting and coming back each day, spent on looks.
export const DAILY_ORBS = 20;
export const ORBS_PER_MESSAGE = 1;
export const MAX_MESSAGE_ORBS_PER_DAY = 25;

// id -> { kind, name, price, value }
export const SHOP = {
  "color-gold": { kind: "name_color", name: "Gold name", price: 60, value: "#fbbf24" },
  "color-pink": { kind: "name_color", name: "Neon pink name", price: 60, value: "#f472b6" },
  "color-cyan": { kind: "name_color", name: "Cyan name", price: 60, value: "#22d3ee" },
  "color-green": { kind: "name_color", name: "Mint name", price: 60, value: "#4ade80" },
  "color-purple": { kind: "name_color", name: "Nebula purple name", price: 60, value: "#c084fc" },
  "color-red": { kind: "name_color", name: "Crimson name", price: 60, value: "#f87171" },
  "frame-glow": { kind: "frame", name: "Glow frame", price: 120, value: "glow" },
  "frame-stars": { kind: "frame", name: "Starry frame", price: 180, value: "stars" },
  "frame-fire": { kind: "frame", name: "Flame frame", price: 250, value: "fire" },
  "badge-star": { kind: "badge", name: "⭐ Star badge", price: 80, value: "⭐" },
  "badge-rocket": { kind: "badge", name: "🚀 Builder badge", price: 150, value: "🚀" },
  "badge-brain": { kind: "badge", name: "🧠 Brainy badge", price: 150, value: "🧠" },
  "badge-crown": { kind: "badge", name: "👑 Legend badge", price: 500, value: "👑" },
  "badge-plus": { kind: "badge", name: "💎 Plus badge (Pro and up)", price: 0, value: "💎", plusOnly: true },
};

export const FREE_COLORS = ["#e2e8f0", "#a5b4fc", "#93c5fd", "#fda4af", "#fde68a", "#a7f3d0"];
export const AVATAR_EMOJI = ["🌌", "🪐", "🚀", "⭐", "🌙", "☄️", "👾", "🤖", "🐱", "🐶", "🦊", "🐼", "🐸", "🦄", "🐉", "🎮", "🎨", "🎧", "⚽", "🏀", "🍕", "🌈", "🔥", "💎"];
export const AVATAR_BG = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#334155"];

// Like Discord Nitro: Pro and up get these free, and more stars from quests.
export const PLUS_FREE = [...Object.keys(SHOP).filter((id) => SHOP[id].kind === "name_color"), "frame-glow", "badge-plus"];
export const STAR_MULTIPLIER = { pro: 1.5, team: 2, enterprise: 2, secret: 2, admin: 2 };
