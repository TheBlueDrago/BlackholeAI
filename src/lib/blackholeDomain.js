export const BLACKHOLE_TLD = ".blackhole";

// Game genre → address ending. A shooter called "shooter.io" lives at shooter.io.shooter.
export const GAME_TLDS = {
  io: "io",
  shooting: "shooter",
  horror: "horror",
  action: "action",
  arcade: "arcade",
  puzzle: "puzzle",
  racing: "racing",
  sports: "sports",
  adventure: "adventure",
  strategy: "strategy",
};

// Every published website lives at <name>.blackhole — the ending is fixed, only the name is chosen.
export const domainOf = (name) => `${(name || "your-site").toLowerCase()}${BLACKHOLE_TLD}`;

export const gameDomainOf = (name, genre) => `${(name || "my-game").toLowerCase()}.${GAME_TLDS[genre] || "game"}`;

export const cleanAddress = (q) =>
  (q || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

// Resolve what was typed into the address bar to a site or a game, or null for a plain search.
export function resolveAddress(q, sites = [], games = []) {
  const a = cleanAddress(q);
  if (!a) return null;
  const site = sites.find((s) => domainOf(s.name) === a || s.name === a);
  if (site) return { kind: "site", item: site };
  const game = games.find((g) => gameDomainOf(g.name, g.genre) === a || g.name === a);
  if (game) return { kind: "game", item: game };
  return null;
}
// A published site's real address, or "" if the name isn't a valid site name (letters,
// digits and hyphens). Names can come from a link or from a record anyone could write, and
// one like "evil.com#" would otherwise make https://evil.com#.blackhole-ai-tech.com, which is
// really evil.com dressed up as one of ours.
export const SITE_NAME = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
export const siteUrl = (name) => {
  const n = String(name || "").toLowerCase();
  return SITE_NAME.test(n) ? `https://${n}.blackhole-ai-tech.com` : "";
};
