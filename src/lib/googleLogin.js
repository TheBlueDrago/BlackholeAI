import { base44 } from "@/api/base44Client";

// "Continue with Google". Base44 refuses to finish a sign-in that starts on a site not registered
// with the Base44 app ("Domain is not valid"), and only the old address is. So on nebuluxai.com
// the sign-in starts from a small page on the old address (functions/auth-start.js), and its way
// back (functions/auth-bounce.js) returns people to nebuluxai.com, signed in.
const OLD = "https://blackhole-ai-tech.com";

export function googleLogin(returnTo = "/") {
  const host = window.location.hostname;
  if (host !== "nebuluxai.com" && host !== "www.nebuluxai.com") {
    base44.auth.loginWithProvider("google", returnTo);
    return;
  }
  window.location.href = `${OLD}/auth-start?to=${encodeURIComponent(returnTo)}`;
}
