// Replaces Base44's hosted publish-site function, whose UploadFile call is metered
// against Base44's monthly integration quota ("You have reached the limit of
// integrations for this month"). This exact static path takes routing precedence
// over the catch-all proxy at functions/api/[[path]].js and ships with every
// Cloudflare Pages deploy. The HTML is stored in Cloudflare KV; see
// cloudflare-lib/published.js for why and how.
// Same contract the frontend expects: { name, html, ownerName } -> { ok, id }.
import { json, publish } from "../../../../../cloudflare-lib/published.js";
import { planLimitCheck } from "../../../../../cloudflare-lib/publishcheck.js";

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  return publish(context, "site", {
    name: String(body.name || "").toLowerCase(),
    html: String(body.html || ""),
    extra: { ownerName: String(body.ownerName || "") },
    checkLimit: planLimitCheck(context, "site"),
  });
}
