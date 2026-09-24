// Offline guard for the Base44 functions (base44/functions/*/entry.ts): they're deployed by
// hand with the Base44 CLI and can't run here, so at least make sure each one parses as
// TypeScript before anyone deploys it. Uses esbuild, which Vite already brings.
// Run: node scripts/test-base44-syntax.mjs
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { transformSync } from "esbuild";

const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};
const dir = new URL("../base44/functions/", import.meta.url);
let n = 0;
for (const name of readdirSync(dir)) {
  const file = new URL(`${name}/entry.ts`, dir);
  if (!existsSync(file)) continue;
  n++;
  let error = "";
  try {
    transformSync(readFileSync(file, "utf8"), { loader: "ts", format: "esm" });
  } catch (e) {
    error = String((e && e.message) || e).split("\n").slice(0, 3).join(" ");
  }
  assert(!error, `base44/functions/${name} parses${error ? ": " + error : ""}`);
}
assert(n >= 10, `found the Base44 functions (${n})`);
