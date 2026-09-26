// Offline test: the AI support-email replies. Automatic emails never get one (no reply loops),
// and only the support Worker, with the secret key, can ask for a reply.
// Run: node scripts/test-support-mail.mjs
import { isAutomatic } from "../workers/nebulux-support-mail/automatic.js";
import { onRequestPost, SUPPORT_RULES } from "../functions/api/support-reply.js";
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const H = (o = {}) => new Headers(o);
assert(!isAutomatic("sam@gmail.com", H()), "a person's email gets a reply");
assert(["no-reply@shop.com", "noreply@x.com", "mailer-daemon@googlemail.com", "support@nebuluxai.com", "notifications@github.com"].every((f) => isAutomatic(f, H())), "no-reply, bounce, our own and notification senders don't");
assert(isAutomatic("a@b.com", H({ "Auto-Submitted": "auto-replied" })) && isAutomatic("a@b.com", H({ Precedence: "bulk" })) && isAutomatic("a@b.com", H({ "List-Id": "x" })), "auto-replies and mailing lists don't");
assert(/Never ask for passwords/.test(SUPPORT_RULES) && /Never promise refunds/.test(SUPPORT_RULES), "the AI is told never to ask for passwords or promise refunds");
globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
const call = (key) => onRequestPost({ request: new Request("https://x/api/support-reply", { method: "POST", headers: { "x-support-key": key, "content-type": "application/json" }, body: JSON.stringify({ from: "a@b.com", text: "hi" }) }), env: { SUPPORT_KEY: "k".repeat(32), GEMINI_API_KEY: "g" } });
assert((await call("wrong-key-wrong-key-wrong")).status === 403 && (await call("")).status === 403, "without the secret key: refused");
