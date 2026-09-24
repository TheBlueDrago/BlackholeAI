// The publish functions' plan-limit check (cloudflare-lib/publishLimits.js): the person's plan
// from the credit server and their own rows from Base44. Kept out of published.js, which
// credits.js imports, so there's no import cycle.
import { base44 } from "./published.js";
import { entitlement } from "./credits.js";
import { limitError } from "./publishLimits.js";

const ENTITY = { site: "PublishedSite", game: "PublishedGame" };

export function planLimitCheck(context, kind) {
  const { request, env } = context;
  return async (user) => {
    const [ent, owned] = await Promise.all([
      entitlement(env.PUBLISHED_HTML, request, user),
      base44(request, "GET", `entities/${ENTITY[kind]}?q=${encodeURIComponent(JSON.stringify({ created_by_id: user.id }))}`),
    ]);
    return limitError(kind, ent.plan, owned);
  };
}
