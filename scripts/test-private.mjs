// Offline test for the main chat's "are you sure?" check on private info (src/lib/privateInfo.js).
// Run: node scripts/test-private.mjs
const { privateInfoIn } = await import(new URL("../src/lib/privateInfo.js", import.meta.url).href);
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const card = ["4242", "4242", "4242", "4242"].join(" "); // a well-known test card number
for (const [text, what] of [
  [`my card is ${card}`, "a card number"],
  [`card ${card.replace(/ /g, "-")}`, "a card number"],
  [`${card.replace(/ /g, "")} exp 12/30`, "a card number"],
  ["my password is sunshine123", "a password"],
  ["Password: hunter22", "a password"],
  ["call me at (555) 123-4567", "a phone number"],
  ["my number is +1 555-123-4567", "a phone number"],
  ["I live at 5 oak lane", "a home address"],
  ["My address is on the letter", "a home address"],
  ["come to 42 Maple Street after school", "a home address"],
  ["it's 1600 Pennsylvania Ave", "a home address"],
]) assert(privateInfoIn(text) === what, `spots ${what} in ${JSON.stringify(text)}`);

for (const text of [
  "what is 1234567890123 divided by 7?", // long number, not a valid card
  "make a game with 1000000000000000 coins",
  "How do I reset my password?",
  "The password field should be 8 characters",
  "The year 2026 had 365 days",
  "make my site show 555 visitors",
  "Write a story about 3 Little Pigs",
  "I have 2 dogs and 3 cats on my street",
  "make a website for a bakery on Main Street",
  "What does the address bar do?",
  "I live at home with my mom",
  "",
]) assert(privateInfoIn(text) === "", `leaves ${JSON.stringify(text)} alone`);

// Secret keys (built here from pieces, so this file itself holds no key-shaped text).
{
  const { secretKeyIn, privateInfoOnPage } = await import(new URL("../src/lib/privateInfo.js", import.meta.url).href);
  const r = (n, chars = "aB3xY9kQ2mZ7") => Array.from({ length: n }, (_, i) => chars[(i * 7 + 3) % chars.length]).join("");
  const keys = {
    OpenAI: "s" + "k-proj-" + r(40),
    Anthropic: "s" + "k-ant-api03-" + r(40),
    GitHub: "gh" + "p_" + r(36),
    "GitHub fine-grained": "github" + "_pat_" + r(50),
    AWS: "AK" + "IA" + "QWERTYUIOPASDFGH",
    Stripe: "s" + "k_live_" + r(30),
    Slack: "xo" + "xb-" + "123456789012-" + r(20),
    "private key": "-----BEGIN " + "RSA PRIVATE KEY-----\nMIIE...",
    "assigned key": `const API_KEY = "${r(32)}";`,
    Google: "AI" + "za" + r(35),
  };
  for (const [what, k] of Object.entries(keys)) {
    assert(secretKeyIn(`here is my code: ${k} thanks`) === "a secret key", `spots a ${what} key`);
    assert(privateInfoIn(`fix this: ${k}`) === "a secret key", `the main chat asks before sending a ${what} key`);
  }
  for (const text of [
    'const API_KEY = "YOUR_API_KEY_GOES_HERE_1234";',
    'const apiKey = process.env.OPENAI_API_KEY;',
    'token: "<paste your token here, it is long>"',
    "I asked about my task-management app with 40 tasks",
    "what's a good skateboard for beginners?",
    'password = input("Password: ")',
  ]) assert(secretKeyIn(text) === "", `leaves ${JSON.stringify(text)} alone`);
  const page = (js) => `<!DOCTYPE html><html><body><h1>Hi</h1><script>${js}</script></body></html>`;
  const parse = (html) => ({ querySelectorAll: () => [], body: { textContent: html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ") } });
  assert(/secret key/.test(privateInfoOnPage(page(`fetch(u, { headers: { Authorization: "Bearer ${keys.OpenAI}" } })`), parse)), "a key hidden in a page's script is pointed out at publish");
  assert(privateInfoOnPage(page(`loadMaps("${keys.Google}")`), parse) === "", "but a Google browser key (made to be public) isn't");
}
