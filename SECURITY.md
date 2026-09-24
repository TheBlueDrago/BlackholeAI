# Security

## Reporting a problem

If you think you've found a way into accounts, credits, payments or someone else's published
page, please tell us privately first so it can be fixed before anyone else finds it:

- the contact form at https://blackhole-ai-tech.com/contact?topic=security, or
- email thebluedragonstriker@gmail.com

Please don't test against other people's accounts or pages, and don't publish details until
it's fixed. The same contact is in https://blackhole-ai-tech.com/.well-known/security.txt.

## How the app protects money and accounts

A short map for anyone changing this code. Keep these rules when you touch the files named.

- **Prices are set on the server.** Plans and credit packs: `base44/functions/create-checkout`
  (the browser only sends a product id). Discount codes are checked by the Cloudflare
  `promo-discount` function, which `create-checkout` asks as the buyer. Site sales:
  `base44/functions/site-checkout` uses the site owner's stored products.
- **Taken-down sites can't sell.** `site-checkout` asks the Cloudflare `page-status` function
  before charging, and Monitor's payout checks and the daily payout email hold any sale from a
  taken-down site (`src/lib/payoutChecks.js`). Plans are always quantity 1 at checkout.
- **Shown prices match charged prices.** `scripts/test-prices.mjs` fails if any page's plan
  price or credit amount drifts from `create-checkout` or `PLAN_TOTALS`.
- **A payment only counts when the provider's signed message says so**
  (`base44/functions/payments-webhook`, RS256-verified). Purchase and sale records can only be
  written by the payment functions (entity RLS: admin/service only).
- **Credits are counted on the server** (`cloudflare-lib/credits.js`). Anything users can edit
  about themselves (User.plan, User.bonus, …) is ignored. One-time grants (welcome bonus,
  referral rewards, promo codes) use once-keys in `adjustBonus`, so parallel requests can't
  claim them twice.
- **Bans are enforced on the server.** Admin bans and blocks live in KV (`grant:<id>`), which
  only admins write; `cloudflare-lib/bans.js` checks them in the AI, publishing, promo codes,
  referral rewards, team invites and the gallery. Clearing your own User row can't lift one.
- **Plan limits are enforced when publishing** (`cloudflare-lib/publishLimits.js`, checked by
  the publish functions through `publishcheck.js`), not only in the app. Game play counts are
  never taken from the page.
- **Published page names belong to their owner.** Anyone can write their own
  PublishedSite/PublishedGame rows straight into Base44, so a row alone proves nothing. The
  owner is whoever `publish()` recorded in KV metadata (`ownerOf` in
  `cloudflare-lib/published.js`); serving uses `cloudflare-lib/pagesource.js`. Site names are
  checked on the server (letters, digits, hyphens; official-looking names refused).
- **Pages people make are walled off.** Published sites run on their own subdomain (served by
  `workers/blackhole-site-router`, which adds nosniff and a Permissions-Policy with no camera,
  microphone, USB or payment sheet); on the app's origin they're served with
  `Content-Security-Policy: sandbox`; in-app previews use sandboxed frames without
  `allow-same-origin` (`src/lib/previewShim.js`, guarded by `scripts/test-frames.mjs`).
- **Nothing dangerous is taken from a link.** App settings (`src/lib/app-params.js`), sign-in
  returns (`src/lib/authReturnTo.js`), site addresses (`siteUrl`) and the Blackhole Browser
  (`safeWebUrl`, both in `src/lib/blackholeDomain.js`) are all validated.
- **Easy-to-guess passwords are refused** at sign-up and password reset
  (`src/lib/passwordCheck.js`, before the password is sent to Base44).
- **Guessing is limited.** Sign-in, sign-up codes, sign-up and reset emails pass through the
  `/api` proxy (`functions/api/[[path]].js`), which refuses too many tries per account and per
  network with a 429 (`cloudflare-lib/authlimit.js`).
- **Admin actions are logged** (`cloudflare-lib/audit.js`, Monitor → Admin log) with where they
  came from, and Monitor warns when they came from more than one country in 30 days. Every
  admin endpoint checks the admin role on the server.
- **Phishing checks at publish** (`cloudflare-lib/phishing.js`, `scan.js`): forms or scripts
  that send passwords or card numbers to another website, and fake Blackhole AI sign-in pages.

Offline tests for all of this run with `npm test`.
