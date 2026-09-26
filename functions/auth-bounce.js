// Google sign-in for nebuluxai.com. Base44 only sends people back to addresses registered in
// the Base44 app, and only blackhole-ai-tech.com is (registering nebuluxai.com there would make
// Base44 publish its own copy of the site on it). So sign-in on nebuluxai.com goes through
// Base44 with this page on the old address as the way back (src/lib/googleLogin.js), and this
// page passes the new session straight on to nebuluxai.com, the only place it ever sends it.
const NEW_ORIGIN = "https://nebuluxai.com";

// A path on this site only: one leading slash, no "//", no backslash (same rule as
// src/lib/authReturnTo.js), and none of the app's start-up settings.
export function safePath(raw) {
  try {
    const url = new URL(String(raw || "/"), NEW_ORIGIN);
    if (url.origin !== NEW_ORIGIN) return "/";
    for (const p of ["access_token", "clear_access_token", "app_id", "app_base_url", "functions_version", "from_url"]) url.searchParams.delete(p);
    const path = url.pathname + url.search;
    return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "/";
  } catch {
    return "/";
  }
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("access_token") || "";
  const to = new URL(safePath(url.searchParams.get("to")), NEW_ORIGIN);
  // A session token looks like a JWT; anything else isn't passed on.
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) && token.length < 4096) to.searchParams.set("access_token", token);
  return new Response(null, {
    status: 302,
    headers: { location: to.toString(), "cache-control": "no-store", "referrer-policy": "no-referrer" },
  });
}
