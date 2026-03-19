# feedback2code

Turn website feedback into production-ready pull requests. Embed a lightweight chat widget to collect user input and automatically generate code changes via an AI coding agent.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Widget feedback automation (E2B + OpenCode)

When someone submits feedback through the embed, the app schedules an [E2B](https://e2b.dev) sandbox that clones the GitHub repo, runs [OpenCode](https://opencode.ai) with **MiniMax**, pushes a branch, and opens a PR.

GitHub auth stays **inside the sandbox**: the same **GitHub App** credentials (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`) are written into the VM only long enough to mint **installation tokens** (see `lib/feedback-agent/e2b/e2b-github.mjs`). The repo remote is scrubbed before OpenCode runs so the agent does not see tokens. PRs are created as your **GitHub App** bot.

Set these **server-only** variables (see `.env.example`):

- `E2B_API_KEY`
- `MINIMAX_API_KEY`
- GitHub App credentials (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, and the rest you already use for the dashboard install flow)
- Users must complete the **GitHub App install** so `githubInstallationId` is stored (used to pick the installation when minting tokens in the sandbox).

**If push/PR fails with `403` / `Permission … denied to …[bot]`:** the app is recognized but cannot write to that repo. In [GitHub App settings](https://github.com/settings/apps) → your app → **Permissions**: set **Repository permissions → Contents** and **Pull requests** to **Read and write**, save, then reinstall the app (GitHub will prompt to accept the new permissions). On the install screen, choose **All repositories** or ensure **every repo you add in the dashboard** is checked. For organization repos, an org admin may need to approve the app under **Organization settings → Third-party access**.

**Vercel / serverless:** `next/server` `after()` still runs under your function **max duration** (often 10–60s on hobby/pro). A full agent run can take many minutes. For production, run the app on a host with a long timeout, or move `runE2bFeedbackAgent` behind a queue/worker (e.g. Inngest, Trigger.dev, a small Railway service).

## Deploy on Vercel

See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying). Configure env vars and database migrations (`prisma migrate deploy` runs in `npm run build`).
