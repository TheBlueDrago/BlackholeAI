// Offline test: the Google sign-in bounce (functions/auth-bounce.js) only ever sends the session
// to nebuluxai.com. Run: node scripts/test-auth-bounce.mjs
import { onRequestGet, safePath } from "../functions/auth-bounce.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const jwt = "aaa.bbb.ccc";
const go = async (qs) => (await onRequestGet({ request: new Request(`https://blackhole-ai-tech.com/auth-bounce?${qs}`) })).headers.get("location");
assert((await go(`access_token=${jwt}&to=%2Fchat`)) === `https://nebuluxai.com/chat?access_token=${jwt}`, "back to nebuluxai.com, signed in");
for (const evil of ["https://evil.com/x", "//evil.com", "/\\evil.com", "javascript:alert(1)"]) {
  assert((await go(`access_token=${jwt}&to=${encodeURIComponent(evil)}`)).startsWith("https://nebuluxai.com/"), `never anywhere else (${evil})`);
}
assert(safePath("/chat?app_base_url=https://evil.com&x=1") === "/chat?x=1", "the app's start-up settings can't be smuggled in");
assert(!(await go("access_token=<script>&to=/")).includes("script"), "only a real session token is passed on");
