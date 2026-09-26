// Offline test for the password rules at sign-up and password reset (src/lib/passwordCheck.js).
// Run: node scripts/test-passwords.mjs
// A file URL, so the import works on Windows too.
const { passwordProblem, passwordStrength } = await import(new URL("../src/lib/passwordCheck.js", import.meta.url).href);
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};

const refused = [
  "", "short", "1234567", // too short
  "aaaaaaaa", "!!!!!!!!!!", // one character
  "12345678", "87654321", "abcdefgh", "qwertyui", "asdfghjkl", "1qaz2wsx3edc", // runs
  "83920175", "0000011111", // numbers only, under 12
  "password", "Password1", "PASSWORD123!", "p@ssw0rd", "minecraft2024", "Roblox123", "iloveyou!!", "123blackhole", "Nebulux AI", "letmein99", "sunshine.",
  "x".repeat(129),
];
for (const p of refused) assert(passwordProblem(p) !== "", `refused ${JSON.stringify(p.length > 20 ? p.slice(0, 8) + "…" : p)}`);

const fine = ["correct horse battery", "Tr0mbone-Lemon", "purple-giraffe-42", "my dog eats socks", "q8#Lr2!vZp", "839201756412", "minecraft castle builder"];
for (const p of fine) assert(passwordProblem(p) === "", `accepted ${JSON.stringify(p)}`);

assert(passwordProblem("maya.jones2024", "maya.jones@example.com") !== "", "the email's name is refused");
assert(passwordProblem("Mayajones!!", "maya.jones@example.com") !== "", "the email's name is refused ignoring dots and case");
assert(passwordProblem("jo-and-the-boat", "jo@example.com") === "", "a very short email name isn't treated as a problem");
assert(passwordProblem("purple-giraffe-42", "") === "" && passwordProblem("purple-giraffe-42", undefined) === "", "no email is fine");

assert(passwordStrength("purple-giraffe") === "strong", "14+ characters is strong");
assert(passwordStrength("Tr0mbone-L") === "strong", "10+ characters of three kinds is strong");
assert(passwordStrength("trombones") === "ok", "short and one kind is ok, not strong");
