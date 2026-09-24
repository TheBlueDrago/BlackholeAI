// Password rules for sign-up and password reset, checked in the browser before the password
// goes to Base44 (which has its own checks). Simple enough for young makers to follow: long
// enough, not one of the passwords attackers try first, not the email address, and not a
// run like 12345678 or aaaaaaaa. Guessing lists of common passwords is how most accounts
// are broken into, so that's what this stops; it doesn't demand symbols or capitals.
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 128;

// Lower-case; a password is also refused if it's one of these with numbers or symbols
// added on the end (Password123!, minecraft2024).
const COMMON = new Set(
  (
    "password passw0rd p@ssword p@ssw0rd pass pass123 qwerty qwertyuiop qwertyui qwerty123 iloveyou iloveu " +
    "letmein welcome welcome1 admin administrator login monkey dragon football baseball basketball soccer " +
    "hockey master sunshine princess superman batman spiderman starwars pokemon pikachu minecraft roblox " +
    "fortnite freedom whatever trustno1 shadow michael jennifer charlie jordan hello hellokitty helloworld " +
    "abc abcd abcdef asdf asdfgh asdfghjkl zxcvbnm 1q2w3e4r 1q2w3e4r5t 1qaz2wsx qazwsx changeme secret " +
    "computer internet blackhole blackholeai google facebook instagram youtube tiktok snapchat discord " +
    "lovely flower cookie chocolate summer winter spring autumn test testing default user guest ninja " +
    "mustang killer hunter ranger buster tigger ginger pepper daniel ashley jessica andrew joshua matthew " +
    "thomas robert family friends school teacher student iloveyou1 loveyou love baby angel"
  ).split(" "),
);

// Runs of keys or letters people type as a "password".
const RUNS = ["01234567890", "abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm", "1qaz2wsx3edc4rfv5tgb"];

// The problem with a password, in plain words, or "" when it's fine to use.
export function passwordProblem(password, email = "") {
  const p = String(password || "");
  if (p.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (p.length > MAX_PASSWORD) return `Use ${MAX_PASSWORD} characters or fewer.`;
  const lower = p.toLowerCase();
  if (/^(.)\1+$/.test(p)) return "Don't just repeat one character.";
  if (RUNS.some((r) => r.includes(lower) || [...r].reverse().join("").includes(lower))) return "That's too easy to guess. Try a few random words together.";
  if (/^\d+$/.test(p) && p.length < 12) return "Add some letters: numbers alone are quick to guess.";
  const core = lower.replace(/[\d\s!@#$%^&*().,?_-]+$/, "").replace(/^[\d\s!@#$%^&*().,?_-]+/, "");
  if ([lower, core, core.replace(/[\s._-]+/g, "")].some((w) => COMMON.has(w))) return "That password is on the lists attackers try first. Try a few random words together.";
  const name = String(email || "").toLowerCase().split("@")[0].replace(/[^a-z0-9]/g, "");
  if (name.length >= 4 && lower.replace(/[^a-z0-9]/g, "").includes(name)) return "Don't use your email address in your password.";
  return "";
}

// How strong an acceptable password looks, for the hint under the field: "ok" or "strong".
export function passwordStrength(password) {
  const p = String(password || "");
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
  return p.length >= 14 || (p.length >= 10 && kinds >= 3) ? "strong" : "ok";
}
