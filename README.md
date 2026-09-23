# Base44 Project

Use this repository to run and edit the app locally, then publish changes back through Base44.

Any change pushed to the repo will also be reflected in the Base44 Builder.

## How This App Is Hosted

- **Frontend + API overrides: Cloudflare Pages** (project `nebuluxai`, domain `blackhole-ai-tech.com`). Every push to `main` deploys automatically. `functions/` holds Pages Functions: `functions/api/[[path]].js` proxies `/api/*` to Base44, and the files under `functions/api/apps/<appId>/functions/` replace specific Base44 functions (AI chat, credits, admin grants, referrals, publishing, game drafts, `get-site-html`) or add new ones (reports and take-downs, the gallery, account-content deletion). Shared code is in `cloudflare-lib/`. Published pages are also served at `/published/<kind>/<name>` with a `Content-Security-Policy: sandbox` header, because that path is on the app's own origin.
- **Storage: Cloudflare KV** namespace `published-html`, bound as `PUBLISHED_HTML`. Holds published site/game HTML, game drafts, and the server-side credit records (key prefixes `site:`, `game:`, `draft:`, `grant:`, `bonus:`, `usage:`, `teamusage:`), referrals (`refcode:`, `refcodeof:`, `referrals:`, `referredby:`, `referredemail:`, `welcome:`), moderation (`reports` — one key for all open reports — and `blocked:<kind>:<name>` for take-downs) and the public gallery (`showcase`). Free tier: 1,000 writes/day, shared by all of these, so endpoints that write on demand are throttled (`cloudflare-lib/ratelimit.js`, using the free edge cache).
- **Moderation:** every published page gets a "Report" link; reports show in Monitor → Reported sites, where "Hide site" takes a page down (it then shows "removed", and its owner can't republish it). Pages with a form that sends passwords or card numbers to another website are refused at publish time and when served. Offline tests (fake Base44, KV, Gemini and edge cache): `npm test`.
- **AI: Google Gemini (free tier)** via the `GEMINI_API_KEY` secret on the Pages project.
- **Published sites: the `blackhole-site-router` Worker** on `*.blackhole-ai-tech.com/*`. Its code is in `workers/blackhole-site-router/` (deploy with `npx wrangler deploy` from that folder).
- **Base44:** sign-in, the database (entities), payments (`create-checkout`, `site-checkout`, `payments-webhook`) and a few remaining functions. Base44 is **not** connected to this repo or the domain (keep it that way: its GitHub sync moves `functions/` and breaks Cloudflare). To ship a payment change, deploy just that function with the Base44 CLI: `npx base44 login`, then `npx base44 --app-id 6a8b5eb7787b8a4d6a18f662 functions deploy <name>`. The deployed functions use `main.ts` as the entry file (payments-webhook is deployed flat, importing `./adminNotify.ts`), so stage a copy in that layout first (`functions pull <name>` shows it).

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.

See the [Base44 CLI docs](https://docs.base44.com/developers/references/cli/get-started/overview) if you want to run Base44 commands directly.

## Run Locally

Run the full local development environment from the project root:

```bash
base44 dev
```

`base44 dev` starts the local Base44 development backend and, when this app is configured for it, also starts the frontend dev server for you. Use the frontend URL printed by the command.

For example, when the Base44 project config includes a `serveCommand`, `base44 dev` can launch the frontend too:

```json5
{
  "site": {
    "serveCommand": "npm run dev"
  }
}
```

In a Base44 project this lives in `base44/config.jsonc`.

## Run Only The Frontend

If you only want to work on the frontend against the hosted Base44 backend, run:

```bash
npm run dev
```

Open the local URL printed by Vite.

## Use The Hosted Backend

For frontend-only development, create or update `.env.local` in the project root:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

`VITE_BASE44_APP_ID` identifies the Base44 app.

`VITE_BASE44_APP_BASE_URL` tells the Base44 Vite plugin where to send local `/api` requests. Point it at your deployed Base44 app URL when you want the local frontend to use the hosted backend.

When you use `base44 dev`, the command injects the local Base44 values for you, so `.env.local` is mainly needed for frontend-only workflows.

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

## Docs & Support

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Base44 CLI command reference: [https://docs.base44.com/developers/references/cli/commands/introduction](https://docs.base44.com/developers/references/cli/commands/introduction)

Support: [https://app.base44.com/support](https://app.base44.com/support)
