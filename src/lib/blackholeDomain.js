export const BLACKHOLE_TLD = ".blackhole";

// Every published site lives at <name>.blackhole — the ending is fixed, only the name is chosen.
export const domainOf = (name) => `${(name || "your-site").toLowerCase()}${BLACKHOLE_TLD}`;

// Turn whatever was typed into the address bar into a site slug, or null if it's a plain search.
export function slugFromAddress(q) {
  const s = (q || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (s.endsWith(BLACKHOLE_TLD)) return s.slice(0, -BLACKHOLE_TLD.length);
  return null;
}