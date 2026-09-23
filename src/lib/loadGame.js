import { base44 } from "@/api/base44Client";
import { findCredentialForm } from "../../cloudflare-lib/phishing.js";

// Loads a published game for the game views. Checks the admin take-down flag alongside
// Base44's get-game-html (which doesn't), and refuses games with a form that sends
// passwords or card numbers to another website, so neither can be undone by writing
// the game's record directly.
// -> { html, title, genre } | { removed: "why" } | null (not found)
export async function loadGame(name) {
  const [res, status] = await Promise.all([
    base44.functions.invoke("get-game-html", { name }),
    base44.functions.invoke("page-status", { kind: "game", name }).catch(() => null),
  ]);
  const d = res.data;
  if (!d || d.error || !d.html) return null;
  if (status?.data?.blocked) return { removed: "This game was taken down for breaking the Blackhole AI rules." };
  if (findCredentialForm(d.html)) return { removed: "This game asks for passwords or card numbers, which isn't allowed here." };
  return { html: d.html, title: d.title, genre: d.genre };
}
