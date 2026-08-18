<p align="center">
  <img src="./docs/hero.png" alt="feedback2code — Your client describes it. The PR writes itself." width="100%">
</p>

<p align="center">
  <a href="https://www.feedback2code.dev"><img src="https://img.shields.io/badge/cloud-feedback2code.dev-ff6b00?style=flat-square" alt="Cloud: feedback2code.dev"></a>
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/agent-OpenCode%20%2B%20MiniMax--M3-ff6b00?style=flat-square" alt="OpenCode + MiniMax-M3">
</p>

<h1 align="center">feedback2code</h1>

<p align="center">
  <strong>Your client describes it. The PR writes itself.</strong>
</p>

<p align="center">
  Feedback automation for agencies and freelancers.<br>
  One script tag on a client site. Their request becomes a pull request in <em>your</em> repo.
</p>

<p align="center">
  <a href="https://www.feedback2code.dev"><strong>Use the cloud version →</strong></a>
  &nbsp;·&nbsp;
  <a href="https://www.feedback2code.dev">feedback2code.dev</a>
</p>

---

## Use it (cloud)

The product lives at **[www.feedback2code.dev](https://www.feedback2code.dev)**.

That is the hosted version: GitHub login, dashboard, widget, billing, and the
agent that turns feedback into PRs. Free tier, no credit card, under three
minutes to first setup.

| | |
|---|---|
| **Start** | [www.feedback2code.dev](https://www.feedback2code.dev) → **Start for free** (GitHub) |
| **Plans** | Free: 10 submissions / 30 days · Pro: 100 / 30 days |
| **You keep** | Review and merge. Nothing ships without you. |

This repository is the **source** of that product — published so you can see
how it works. It is **not** a self-host kit and **not** open source. If you
want feedback2code, use the [cloud](https://www.feedback2code.dev).

## What it does

You ship sites for clients. They email screenshots, Slack you “can the button
be blue?”, and you spend the afternoon translating that into a commit.

feedback2code puts a small chat widget on the live site. The client describes
the change in their own words. An isolated coding agent clones the repo,
implements it, and opens a pull request. You review the diff like any other PR.

Works on public and private GitHub repos. The widget is one script tag — no
framework, no build step on the client site.

## How it works

1. **Embed.** Drop the snippet on any client site.
2. **Sandbox.** Feedback schedules an [E2B](https://e2b.dev) VM (2 vCPU, 2 GiB) that clones the target repo. The sandbox has no public internet.
3. **Agent.** [OpenCode](https://opencode.ai) with **MiniMax-M3** implements the request inside the VM.
4. **PR.** Your GitHub App bot pushes a branch and opens a pull request. You review, merge, or close.

GitHub credentials never stay in the agent’s environment: the sandbox mints
short-lived installation tokens, then scrubs the remote before OpenCode runs.
See [`lib/feedback-agent/e2b/e2b-github.mjs`](./lib/feedback-agent/e2b/e2b-github.mjs).

## Who it’s for

Freelancers and agencies who maintain client sites on GitHub and would rather
review a diff than decode an email. It also fits SaaS products, docs sites, and
internal tools — anywhere “change this on the live site” should become a PR.

The agent does not push to production. A bad change is a closed pull request.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript (strict) |
| UI | Tailwind CSS 4, Geist Mono |
| Auth | NextAuth (GitHub OAuth) + GitHub App |
| Data | PostgreSQL, Prisma |
| Agent | E2B sandboxes, OpenCode, MiniMax-M3 |
| Billing | Stripe (Free / Pro) |
| Email | Resend |
| Hosting | Vercel — the live app is [feedback2code.dev](https://www.feedback2code.dev) |

## This repository

Source-available for **reference and transparency**. See [LICENSE](./LICENSE).

You may read the code. You may not copy, modify, deploy, redistribute, or reuse
it, and you may not use it to train AI models. Running your own instance is not
permitted. Use the [cloud](https://www.feedback2code.dev), or
[get in touch](https://www.feedback2code.dev/legal) about licensing.

<details>
<summary><strong>Reading the source</strong> — env layout, GitHub App URLs, E2B template, Stripe</summary>

Local files: copy [`.env.example`](./.env.example) to gitignored
`.env.development` / `.env.production`. Do not commit secrets. Do not add
`.env` or `.env.local` — Next would load them and override the others.

GitHub App URLs use the same origin as `NEXT_PUBLIC_APP_URL`:

| Setting | Value |
|---|---|
| Setup URL | `{origin}/api/github/setup` |
| Callback | `{origin}/api/github/callback` |
| Webhook (optional) | `{origin}/api/github/webhook` |

Sandbox image: [`e2b/feedback-agent/e2b.Dockerfile`](./e2b/feedback-agent/e2b.Dockerfile)
(`feedback2code-agent`, Node 20, OpenCode preinstalled). Production hosts need
`E2B_API_KEY` and optionally `E2B_FEEDBACK_SANDBOX_TEMPLATE`.

Stripe webhook: `POST /api/stripe/webhook` on the cloud origin
`https://www.feedback2code.dev/api/stripe/webhook`. Events:
`checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`.

If a GitHub App push returns `403` / `Permission denied to …[bot]`, set
**Contents** and **Pull requests** to Read and write, then reinstall the app
on the repos you use.

`next/server` `after()` still counts against the function max duration. A full
agent run can take minutes; production uses a host (or queue) that can wait.

</details>

## License

**Proprietary — all rights reserved.** Copyright (c) 2026 Fabian Stehle.

Not open source. Full terms: [LICENSE](./LICENSE).

Product and licensing: [www.feedback2code.dev](https://www.feedback2code.dev)
