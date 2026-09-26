// Starts Google sign-in for nebuluxai.com from this old address. Base44 records the page a
// sign-in starts from and refuses to finish it ("Domain is not valid") unless that site is
// registered with the Base44 app, and only blackhole-ai-tech.com is. So nebuluxai.com sends
// people here (src/lib/googleLogin.js); this page moves on to Base44 from this address, and
// the way back (functions/auth-bounce.js) returns them to nebuluxai.com.
import { safePath } from "./auth-bounce.js";

const OLD = "https://blackhole-ai-tech.com";
const APP_ID = "6a8b5eb7787b8a4d6a18f662";

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  // Only from the old address itself (a nebuluxai.com copy of this page would start from there).
  if (url.hostname !== "blackhole-ai-tech.com") {
    return Response.redirect(`${OLD}/auth-start${url.search}`, 302);
  }
  const provider = url.searchParams.get("provider") === "microsoft" ? "/microsoft" : "";
  const back = `${OLD}/auth-bounce?to=${encodeURIComponent(safePath(url.searchParams.get("to")))}`;
  const login = `${OLD}/api/apps/auth${provider}/login?app_id=${APP_ID}&from_url=${encodeURIComponent(back)}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="referrer" content="origin"><title>Signing in to Nebulux AI</title></head><body style="background:#05060f;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>Signing in to Nebulux AI…</p><script>location.replace(${JSON.stringify(login)});</script></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html;charset=UTF-8", "cache-control": "no-store", "referrer-policy": "origin" } });
}
