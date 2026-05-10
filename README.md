# feedback2code

Turn website feedback into production-ready pull requests. Embed a lightweight chat widget to collect user input and automatically generate code changes via an AI coding agent.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). 

## Environment (two files)

| File | When it loads |
|------|----------------|
| [`.env.development`](./.env.development) | `npm run dev` |
| [`.env.production`](./.env.production) | `npm run build` and Vercel production builds |

Do not add `.env`, `.env.local`, or other dotenv files: Next would load them and override `.env.development` / `.env.production`.

**Vercel:** Dashboard [Environment Variables](https://vercel.com/docs/projects/environment-variables) override repo env files. To use only `.env.production`, clear duplicate keys from the Vercel project (or leave the dashboard empty).

**Prisma:** `npm run build` runs `prisma migrate deploy` with [dotenv-cli](https://www.npmjs.com/package/dotenv-cli) so `DATABASE_URL` is read from `.env.production`. For local migrations use `npm run migrate:dev`.

**Vercel / serverless:** Deployed Lambdas often do not ship `.env*` files, so `prebuild` / `predev` runs [`scripts/generate-server-env.mjs`](./scripts/generate-server-env.mjs) and writes `lib/generated/server-env.ts` (gitignored). That module assigns `process.env` at import time so NextAuth and Prisma always see secrets inside the server bundle.

## Getting Started

```bash
npm run dev
```

Run the dev server on port 3000, then open either [http://localhost:3000](http://localhost:3000) or your **TryCloudflare** URL. [`.env.development`](./.env.development) sets `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` to that tunnel so GitHub OAuth matches; if the tunnel hostname changes, update those two values and `allowedDevOrigins` in `next.config.ts`.

## Widget feedback automation (E2B + OpenCode)

When someone submits feedback through the embed, the app schedules an [E2B](https://e2b.dev) sandbox that clones the GitHub repo, runs [OpenCode](https://opencode.ai) with **MiniMax**, pushes a branch, and opens a PR.

GitHub auth stays **inside the sandbox**: the same **GitHub App** credentials (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`) are written into the VM only long enough to mint **installation tokens** (see `lib/feedback-agent/e2b/e2b-github.mjs`). The repo remote is scrubbed before OpenCode runs so the agent does not see tokens. PRs are created as your **GitHub App** bot.

Set these **server-only** variables (see `.env.development` / `.env.production`):

- `E2B_API_KEY`
- `E2B_FEEDBACK_SANDBOX_TEMPLATE` (optional; defaults to `feedback2code-agent`)
- `MINIMAX_API_KEY`
- GitHub App credentials (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, and the rest you already use for the dashboard install flow)
- Users must complete the **GitHub App install** so `githubInstallationId` is stored (used to pick the installation when minting tokens in the sandbox).

**E2B sandbox template (required once per team):** Sandboxes use a custom template `feedback2code-agent` (2 vCPU, 2048 MiB RAM) with Node 20 and OpenCode preinstalled — see [`e2b/feedback-agent/e2b.Dockerfile`](./e2b/feedback-agent/e2b.Dockerfile). Publishing uses the [E2B CLI](https://e2b.dev/docs/cli), which requires an **access token** (not just the API key): copy [`.env.e2b.cli.example`](./.env.e2b.cli.example) to `.env.e2b.cli`, add `E2B_ACCESS_TOKEN` from the [API key / access token docs](https://e2b.dev/docs/api-key), then run `npm run e2b:build-feedback-template`. Alternatively run `npx @e2b/cli auth login` in an interactive terminal, then the same npm script. Vercel and other hosts only need `E2B_API_KEY` + `E2B_FEEDBACK_SANDBOX_TEMPLATE` at runtime (not the CLI access token).

**GitHub App URLs (production example):** use the same origin as `NEXT_PUBLIC_APP_URL`. **Setup URL** should be `{origin}/api/github/setup` (GitHub appends `installation_id`). **Callback URL** can be `{origin}/api/github/callback` (forwards to setup) or the setup URL directly. Optional webhook: `{origin}/api/github/webhook` — copy the webhook secret into `GITHUB_APP_WEBHOOK_SECRET` in env so signatures are verified.

**If push/PR fails with `403` / `Permission … denied to …[bot]`:** the app is recognized but cannot write to that repo. In [GitHub App settings](https://github.com/settings/apps) → your app → **Permissions**: set **Repository permissions → Contents** and **Pull requests** to **Read and write**, save, then reinstall the app (GitHub will prompt to accept the new permissions). On the install screen, choose **All repositories** or ensure **every repo you add in the dashboard** is checked. For organization repos, an org admin may need to approve the app under **Organization settings → Third-party access**.

**Vercel / serverless:** `next/server` `after()` still runs under your function **max duration** (often 10–60s on hobby/pro). A full agent run can take many minutes. For production, run the app on a host with a long timeout, or move `runE2bFeedbackAgent` behind a queue/worker (e.g. Inngest, Trigger.dev, a small Railway service).

## Deploy on Vercel

See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying). Production env comes from [`.env.production`](./.env.production) during `next build`. Database migrations run in `npm run build` (`prisma migrate deploy`).

## Stripe subscriptions (Free + Pro)

This app supports:

- `FREE` plan: 10 feedback submissions / rolling 30 days
- `PRO` plan: 100 feedback submissions / rolling 30 days

Required server env vars:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

Create Stripe products/prices via API:

```bash
npm run billing:setup-stripe
```

Then copy the printed `price_...` into `STRIPE_PRO_PRICE_ID`.

Webhook endpoint:

- `POST /api/stripe/webhook`
- In local dev with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Finish Stripe Dashboard setup**

1. **One webhook only** — If two destinations point at the same URL, Stripe may deliver **every event twice**. Delete or disable the duplicate; keep a **single** endpoint for `/api/stripe/webhook`.
2. **Events to send** (enough for this app; you don’t need 200+):

   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

3. **Signing secret** — Each endpoint has its **own** `whsec_...`. Put the secret for the endpoint you keep into `STRIPE_WEBHOOK_SECRET` (if you delete/recreate the endpoint, the secret changes).
4. **Customer portal** — For “Manage billing” to work, enable the portal in test mode [here](https://dashboard.stripe.com/test/settings/billing/portal) and in live mode [here](https://dashboard.stripe.com/settings/billing/portal).
5. **Production webhook URL** — `https://feedback2code.dev/api/stripe/webhook` (use the live endpoint’s signing secret in `.env.production`).

Use **test** Stripe keys in `.env.development` and **live** keys in `.env.production` (`STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`). Until live keys are set in `.env.production`, checkout and webhooks will not work in production.
