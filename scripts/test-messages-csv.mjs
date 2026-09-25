// Offline test for the form-messages spreadsheet (src/lib/messagesCsv.js).
// Run: node scripts/test-messages-csv.mjs
import { messagesCsv } from "../src/lib/messagesCsv.js";

let failed = 0;
const assert = (c, m) => {
  console.log((c ? "ok " : "FAIL ") + m);
  if (!c) failed++;
};
const at = () => "T";
const csv = messagesCsv(
  [
    { at: "2", fields: [["Name", "Sam"], ["Guests", "2"]] },
    { at: "1", fields: [["Name", 'Ana "the best", Lee'], ["Note", "=HYPERLINK(\"http://x\")"]] },
  ],
  at
);
const lines = csv.split("\r\n");
assert(lines[0] === "Received,Name,Guests,Note", "one column per field, in the order they first appear");
assert(lines[1] === "T,Sam,2,", "a message without a field leaves that cell empty");
assert(lines[2].includes('"Ana ""the best"", Lee"'), "commas and quotes are kept safely");
assert(lines[2].includes("'=HYPERLINK") && !/,=HYPERLINK/.test(lines[2]), "a formula a visitor typed can't run in the spreadsheet");
assert(messagesCsv([], at) === "Received", "no messages is just the header");

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
