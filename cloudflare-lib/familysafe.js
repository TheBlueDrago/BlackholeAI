// What Blackhole Browser leaves out because kids use it: adult, gambling and piracy sites.
// Used on search results (functions/.../browserSearch.js) and on addresses typed into the
// browser (src/lib/blackholeDomain.js). Whole words only, so "Essex" or "Sussex" are fine.
export const NOT_FAMILY =
  /\b(porn\w*|xxx|nsfw|hentai|onlyfans|nudes?|camgirls?|escorts?|erotic\w*|xvideos|xhamster|xnxx|redtube|youporn|chaturbate|stripchat|casinos?|sportsbook|betting|torrents?|pirate ?bay|warez|123movies|fmovies|putlocker)\b/i;

export const familySafeText = (text) => !NOT_FAMILY.test(String(text || ""));

// Site names run words together (thepiratebay, bestcasinosite), so for a hostname these
// unmistakable names are matched anywhere in it.
const NOT_FAMILY_HOST = /porn|xvideos|xhamster|xnxx|redtube|chaturbate|stripchat|onlyfans|hentai|piratebay|123movies|fmovies|putlocker|casino|sportsbook/i;

export const familySafeHost = (hostname) => {
  const h = String(hostname || "");
  return familySafeText(h.replace(/[.-]/g, " ")) && !NOT_FAMILY_HOST.test(h);
};
