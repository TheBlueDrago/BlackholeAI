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
]) assert(privateInfoIn(text) === what, `spots ${what} in ${JSON.stringify(text)}`);

for (const text of [
  "what is 1234567890123 divided by 7?", // long number, not a valid card
  "make a game with 1000000000000000 coins",
  "How do I reset my password?",
  "The password field should be 8 characters",
  "The year 2026 had 365 days",
  "make my site show 555 visitors",
  "",
]) assert(privateInfoIn(text) === "", `leaves ${JSON.stringify(text)} alone`);
