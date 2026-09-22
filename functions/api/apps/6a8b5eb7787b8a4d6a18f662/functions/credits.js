// The signed-in user's credit status (plan + per-AI total/used/remaining), computed
// server-side — see cloudflare-lib/credits.js. The app calls this through
// base44.functions.invoke("credits"), which is why it lives at a function path.
import { json } from "../../../../../cloudflare-lib/published.js";
import { currentUser, entitlement, creditStatus } from "../../../../../cloudflare-lib/credits.js";

export async function onRequest(context) {
  const { request, env } = context;
  try {
    const user = await currentUser(request);
    if (!user) return json({ error: "Please sign in." }, 401);
    const ent = await entitlement(env.PUBLISHED_HTML, request, user);
    return json(await creditStatus(env.PUBLISHED_HTML, ent));
  } catch (err) {
    return json({ error: "Could not load credits.", detail: String((err && err.message) || err) }, 500);
  }
}
