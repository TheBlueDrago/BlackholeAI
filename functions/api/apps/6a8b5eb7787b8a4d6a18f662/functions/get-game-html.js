// Replaces Base44's get-game-html (which, like every Base44 function, stopped working
// once the Base44 integration allowance ran out). Same contract:
// { name } -> { html, id, title, genre, plays }. Runs the same checks as get-site-html
// (admin take-down, forms that send passwords/cards elsewhere) and counts the play.
import { json, findByName, kvKey, MAX_BYTES } from "../../../../../cloudflare-lib/published.js";
import { isBlocked } from "../../../../../cloudflare-lib/reports.js";
import { findCredentialForm } from "../../../../../cloudflare-lib/phishing.js";
import { removedPage } from "../../../../../cloudflare-lib/pageserve.js";
import { currentUser } from "../../../../../cloudflare-lib/credits.js";
import { countPlay, readPlays } from "../../../../../cloudflare-lib/plays.js";

async function sourceHtml(kv, game, name) {
  const ref = String(game.html || "");
  if (!/^https?:\/\//.test(ref)) return ref;
  if (ref.includes("/published/game/")) return (kv && (await kv.get(kvKey("game", name)))) || "";
  if (!ref.startsWith("https://")) return "";
  const res = await fetch(ref);
  if (!res.ok) return "";
  const text = await res.text();
  return text.length > MAX_BYTES ? "" : text;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.PUBLISHED_HTML;
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || "");
    if (!name) return json({ error: "name required" }, 400);
    const game = (await findByName(request, "game", name))[0];
    if (!game) return json({ error: "not found" }, 404);
    const extra = (await readPlays(kv))[name];
    const reply = (html) =>
      json({ html, id: game.id, title: game.title || game.name, genre: game.genre, plays: (game.plays || 0) + ((extra && extra.count) || 0) });

    if (kv && (await isBlocked(kv, "game", name))) return reply(removedPage("game"));
    let html = await sourceHtml(kv, game, name);
    if (!html) return json({ error: "not found" }, 404);
    if (findCredentialForm(html)) return reply(removedPage("game", "It asks for passwords or card numbers and sends them to another website, which isn't allowed here."));
    // Fix kept from the Base44 version: the player's 3D mesh was never moved in this game's loop.
    if (name === "shooting-io") {
      html = html.replace(
        "player.g.position.y=player.y;",
        "player.g.position.y=player.y;player.g.position.x=player.x;player.g.position.z=player.z;player.g.rotation.y=yaw;"
      );
    }
    const user = await currentUser(request);
    if (user) await countPlay(kv, name, user.id);
    return reply(html);
  } catch (err) {
    return json({ error: (err && err.message) || "Could not load the game." }, 500);
  }
}
