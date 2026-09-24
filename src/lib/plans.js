// What each plan unlocks in the app. Plan names come from the server's credit status
// (cloudflare-lib/credits.js). Secret can't be bought any more but existing accounts keep it.
const PRO_UP = ["pro", "team", "secret", "enterprise", "admin"];
const TEAM_UP = ["team", "secret", "enterprise", "admin"];

// Galaxy, ZIP download and GitHub push.
export const hasProFeatures = (plan) => PRO_UP.includes(plan);
// Space (the premium creative model) in the designers.
export const hasSpace = (plan) => TEAM_UP.includes(plan);
