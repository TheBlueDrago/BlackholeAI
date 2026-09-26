import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";

// "Continue with Google". On nebuluxai.com, Base44 refuses to send people back ("Domain is not
// valid": only blackhole-ai-tech.com is registered with it), so the round trip starts and ends
// on the old address, whose /auth-bounce page (functions/auth-bounce.js) passes the session
// straight back to nebuluxai.com.
const OLD = "https://blackhole-ai-tech.com";

export function googleLogin(returnTo = "/") {
  const host = window.location.hostname;
  if (host !== "nebuluxai.com" && host !== "www.nebuluxai.com") {
    base44.auth.loginWithProvider("google", returnTo);
    return;
  }
  const back = `${OLD}/auth-bounce?to=${encodeURIComponent(returnTo)}`;
  window.location.href = `${OLD}/api/apps/auth/login?app_id=${encodeURIComponent(appParams.appId)}&from_url=${encodeURIComponent(back)}`;
}
