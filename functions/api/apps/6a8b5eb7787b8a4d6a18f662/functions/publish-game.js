// Replaces Base44's hosted publish-game function, whose UploadFile call is metered
// against Base44's monthly integration quota ("You have reached the limit of
// integrations for this month"). This exact static path takes routing precedence
// over the catch-all proxy at functions/api/[[path]].js and ships with every
// Cloudflare Pages deploy. The HTML is stored in Cloudflare KV; see
// cloudflare-lib/published.js for why and how.
// Same contract the frontend expects: { name, html, title, genre, ownerName, plays? } -> { ok, id }.
import { json, publish } from "../../../../../cloudflare-lib/published.js";
import { planLimitCheck } from "../../../../../cloudflare-lib/publishcheck.js";

// Must match the genre enum in base44/entities/PublishedGame.jsonc, or the write is rejected.
const GENRES = ["io", "shooting", "horror", "action", "arcade", "puzzle", "racing", "sports", "adventure", "strategy"];

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  const extra = {
    title: String(body.title || ""),
    genre: GENRES.includes(body.genre) ? body.genre : "io",
    ownerName: String(body.ownerName || ""),
  };
  // Play counts are counted by the server (cloudflare-lib/plays.js), never taken from the page.
  return publish(context, "game", {
    name: String(body.name || "").toLowerCase(),
    html: String(body.html || ""),
    extra,
    checkLimit: planLimitCheck(context, "game"),
  });
}
