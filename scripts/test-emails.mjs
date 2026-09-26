// Offline test for the sign-up email typo hint (src/lib/emailTypo.js).
// Run: node scripts/test-emails.mjs
// A file URL, so the import works on Windows too.
const { emailSuggestion } = await import(new URL("../src/lib/emailTypo.js", import.meta.url).href);
const assert = (c, m) => {
  if (!c) {
    console.error("FAIL", m);
    process.exitCode = 1;
  } else console.log("ok", m);
};

const fixes = {
  "kid@gmial.com": "kid@gmail.com",
  "kid@gamil.com": "kid@gmail.com",
  "kid@gmai.com": "kid@gmail.com",
  "kid@gmail.con": "kid@gmail.com",
  "kid@gmail.co": "kid@gmail.com",
  "kid@gmailcom": "kid@gmail.com",
  "Kid@GMAIL.CMO": "kid@gmail.com",
  "kid@yaho.com": "kid@yahoo.com",
  "kid@yahoo.cm": "kid@yahoo.com",
  "kid@hotmial.com": "kid@hotmail.com",
  "kid@hotmal.com": "kid@hotmail.com",
  "kid@outlok.com": "kid@outlook.com",
  "kid@iclod.com": "kid@icloud.com",
  "kid@aol.con": "kid@aol.com",
  " kid@gmial.com ": "kid@gmail.com",
};
for (const [typed, want] of Object.entries(fixes)) assert(emailSuggestion(typed) === want, `${typed.trim()} -> ${want}`);

const fine = [
  "kid@gmail.com", "kid@yahoo.com", "kid@hotmail.com", "kid@outlook.com", "kid@icloud.com", "kid@aol.com",
  "kid@mail.com", "kid@email.com", "kid@ymail.com", "kid@gmx.com", "kid@me.com", "kid@live.com", "kid@cloud.com",
  "kid@yahoo.co.uk", "kid@hotmail.ca", "kid@hotmail.fr", "kid@outlook.de", "kid@live.co.uk", "kid@yahoo.com.au",
  "kid@myschool.edu", "kid@company.com", "kid@nebuluxai.com", "kid@proton.me",
  "", "not an email", "a@b@gmail.com", "@gmial.com",
];
for (const e of fine) assert(emailSuggestion(e) === "", `no hint for ${JSON.stringify(e)}`);
