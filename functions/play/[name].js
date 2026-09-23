// /play/<name>: the app's public game page, with the game's name in the link preview.
import { findByName } from "../../cloudflare-lib/published.js";
import { withGameMeta } from "../../cloudflare-lib/playmeta.js";

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const page = await env.ASSETS.fetch(new URL("/", request.url));
  const name = String(params.name || "").toLowerCase();
  if (!page.ok || !/^[a-z0-9.-]{1,63}$/.test(name)) return page;
  let game = null;
  try {
    game = (await findByName(null, "game", name))[0] || null;
  } catch {
    // Base44 unreachable: the page still works, just with the plain preview.
  }
  if (!game) return page;
  const html = withGameMeta(await page.text(), { title: game.title || game.name, genre: game.genre });
  const headers = new Headers(page.headers);
  headers.delete("content-length");
  return new Response(html, { status: 200, headers });
}
