import { DASHBOARD_HOME, dashboardRepoPath } from "@/lib/app-paths";
import { prismaDataFromAgentLlmUsagePayload } from "@/lib/feedback-agent/agent-llm-usage";
import { prisma } from "@/lib/prisma";
import { AGENT_LLM_USAGE_FILE, PR_URL_FILE } from "@/lib/feedback-agent/run-e2b-feedback-agent";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "e2b";
import { createHash, timingSafeEqual } from "node:crypto";
import { sendPrCreatedEmail } from "@/lib/email/send-pr-created-email";
import {
  revokeMinimaxProxyTokensForFeedback,
  validateMinimaxProxyToken,
} from "@/lib/feedback-agent/minimax-proxy-token";
import { branchNameForFeedback } from "@/lib/feedback-agent/run-e2b-feedback-agent";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Allow enough time for polling the PR URL file.
export const maxDuration = 60;

const PR_URL_RE = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/[0-9]+$/;

function dashboardPathForFeedback(repositoryConfigOwner: string, repositoryConfigRepo: string) {
  return dashboardRepoPath(repositoryConfigOwner, repositoryConfigRepo);
}

/** E2B lifecycle webhooks: SHA-256(secret + rawBody), base64, strip trailing `=`. */
function verifyE2bWebhookSignature(
  secret: string,
  rawBody: string,
  payloadSignature: string,
): boolean {
  const expectedSignatureRaw = createHash("sha256")
    .update(secret + rawBody, "utf8")
    .digest("base64");
  const expectedSignature = expectedSignatureRaw.replace(/=+$/, "");
  const provided = payloadSignature.replace(/=+$/, "");
  return constantTimeEquals(expectedSignature, provided);
}

function constantTimeEquals(a: string, b: string): boolean {
  // Both must be same byte length for timingSafeEqual.
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function extractProvidedSignature(req: NextRequest): string | null {
  const headers = req.headers;
  return (
    headers.get("e2b-signature") ??
    headers.get("x-e2b-signature") ??
    headers.get("x-e2b-signature-256") ??
    headers.get("x-e2b-webhook-signature") ??
    headers.get("x-signature") ??
    headers.get("x-signature-256") ??
    headers.get("x-hub-signature-256") ??
    headers.get("x-hub-signature") ??
    null
  );
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const p = payload as Record<string, unknown>;
  const type = typeof p.type === "string" ? p.type : undefined;
  const sandboxId = typeof p.sandboxId === "string" ? p.sandboxId : undefined;
  const sandboxExecutionId =
    typeof p.sandboxExecutionId === "string" ? p.sandboxExecutionId : undefined;
  const feedbackId =
    typeof p.feedbackId === "string" ? p.feedbackId : undefined;
  const payloadPrUrl = typeof p.prUrl === "string" ? p.prUrl : undefined;
  const connectSandboxId = sandboxId ?? sandboxExecutionId;

  if (!type) {
    return NextResponse.json({ ok: true });
  }

  console.log("[e2b webhook]", { type, sandboxId });

  // Custom callback from inside the sandbox (more reliable than lifecycle timing).
  if (type === "f2c.feedback.completed") {
    if (!feedbackId || !payloadPrUrl) {
      return NextResponse.json({ ok: true });
    }

    // Authenticate callback using the per-feedback proxy token (sandbox only).
    const authorization = request.headers.get("authorization");
    const token =
      authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
    if (!token) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const authz = await validateMinimaxProxyToken(token);
    if (!authz.ok) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    if (authz.widgetFeedbackId !== feedbackId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    if (
      connectSandboxId &&
      authz.e2bSandboxId &&
      authz.e2bSandboxId !== connectSandboxId
    ) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    console.log("[e2b webhook] custom callback update", {
      feedbackId,
      prUrl: payloadPrUrl,
    });

    const feedbackRow = await prisma.widgetFeedback.findUnique({
      where: { id: feedbackId },
      select: { repositoryConfigId: true, status: true, prUrl: true, body: true, pagePath: true },
    });

    const repositoryConfig = feedbackRow
      ? await prisma.repositoryConfig.findUnique({
          where: { id: feedbackRow.repositoryConfigId },
          select: {
            owner: true,
            repo: true,
            receivePrCreatedEmail: true,
            user: { select: { email: true, name: true } },
          },
        })
      : null;

    const usagePatch = prismaDataFromAgentLlmUsagePayload(p.agentLlmUsage);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (prisma.widgetFeedback as any).updateMany({
      where: { id: feedbackId },
      data: {
        status: "WAITING_FOR_REVIEW",
        prUrl: payloadPrUrl,
        agentFinishedAt: new Date(),
        ...usagePatch,
      },
    });

    const shouldSend =
      repositoryConfig &&
      repositoryConfig.receivePrCreatedEmail &&
      PR_URL_RE.test(payloadPrUrl) &&
      // Send only the first time we see a PR URL for this feedback item.
      (feedbackRow?.prUrl == null || feedbackRow.prUrl !== payloadPrUrl);

    if (shouldSend) {
      console.log("[email] attempting PR-created email (custom callback)", {
        prUrl: payloadPrUrl,
        intendedUserEmail: repositoryConfig.user?.email ?? null,
        intendedUserName: repositoryConfig.user?.name ?? null,
        mode: process.env.RESEND_EMAIL_MODE ?? "production",
      });

      await sendPrCreatedEmail({
        intendedToEmails: repositoryConfig.user?.email ? [repositoryConfig.user.email] : [],
        intendedRecipientName: repositoryConfig.user?.name ?? null,
        repositoryFullName: `${repositoryConfig.owner}/${repositoryConfig.repo}`,
        owner: repositoryConfig.owner,
        repo: repositoryConfig.repo,
        prUrl: payloadPrUrl,
        feedbackBody: feedbackRow?.body ?? null,
        pagePath: feedbackRow?.pagePath ?? null,
      });
    }

    if (repositoryConfig) {
      revalidatePath(
        dashboardPathForFeedback(repositoryConfig.owner, repositoryConfig.repo),
      );
    }
    revalidatePath(DASHBOARD_HOME);

    // Best-effort kill.
    if (connectSandboxId) {
      try {
        const sandboxToKill = await Sandbox.connect(connectSandboxId);
        await sandboxToKill.kill();
        console.log("[e2b webhook] sandbox killed after custom callback", {
          feedbackId,
          e2bResultCount: result?.count ?? null,
        });
      } catch (e) {
        console.warn("[e2b webhook] failed to kill sandbox after custom callback:", e);
      }
    }

    await revokeMinimaxProxyTokensForFeedback(feedbackId);

    return NextResponse.json({ ok: true });
  }

  if (type === "f2c.feedback.needs_finalize") {
    if (!feedbackId || !connectSandboxId) {
      return NextResponse.json({ ok: true });
    }

    // Authenticate callback using the per-feedback proxy token (sandbox only).
    const authorization = request.headers.get("authorization");
    const token =
      authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
    if (!token) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const authz = await validateMinimaxProxyToken(token);
    if (!authz.ok) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    if (authz.widgetFeedbackId !== feedbackId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    if (
      connectSandboxId &&
      authz.e2bSandboxId &&
      authz.e2bSandboxId !== connectSandboxId
    ) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const appId = process.env.GITHUB_APP_ID;
    const appPkRaw = process.env.GITHUB_APP_PRIVATE_KEY;
    if (!appId || !appPkRaw?.trim()) {
      console.warn("[e2b webhook] needs_finalize but missing GitHub App env");
      return NextResponse.json({ ok: true });
    }

    const feedbackRow = await prisma.widgetFeedback.findUnique({
      where: { id: feedbackId },
      select: {
        status: true,
        repositoryConfigId: true,
      },
    });
    if (!feedbackRow || feedbackRow.status !== "CODING") {
      return NextResponse.json({ ok: true });
    }

    const repositoryConfig = await prisma.repositoryConfig.findUnique({
      where: { id: feedbackRow.repositoryConfigId },
      select: {
        owner: true,
        repo: true,
        user: { select: { githubInstallationId: true } },
      },
    });
    if (!repositoryConfig?.owner || !repositoryConfig.repo) {
      return NextResponse.json({ ok: true });
    }

    const installationId = repositoryConfig.user?.githubInstallationId ?? null;
    if (!installationId) {
      console.warn("[e2b webhook] needs_finalize but missing githubInstallationId", {
        feedbackId,
      });
      return NextResponse.json({ ok: true });
    }

    const appPkPem = appPkRaw.includes("\\n") ? appPkRaw.replace(/\\n/g, "\n") : appPkRaw;
    const e2bAssetDir = join(process.cwd(), "lib/feedback-agent/e2b");
    const e2bGithubJs = readFileSync(join(e2bAssetDir, "e2b-github.mjs"), "utf8").replace(
      /\r\n/g,
      "\n",
    );

    try {
      const sandbox = await Sandbox.connect(connectSandboxId);

      // Re-inject only what's required for finalize, after OpenCode has finished.
      await sandbox.files.write("/home/user/e2b-github.mjs", e2bGithubJs);
      await sandbox.files.write("/home/user/.f2c-gh-app-key.pem", appPkPem);

      const branch = branchNameForFeedback(feedbackId);
      const publicBase =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
        process.env.APP_URL?.replace(/\/$/, "") ??
        "";
      const webhookUrl = publicBase ? `${publicBase}/api/e2b/webhook` : "";

      await sandbox.commands.run(
        `bash -lc 'set -euo pipefail
          chmod +x /home/user/finalize-feedback.sh
          bash /home/user/finalize-feedback.sh
        '`,
        {
          background: true,
          timeoutMs: 3_600_000,
          envs: {
            F2C_WEBHOOK_URL: webhookUrl,
            F2C_FEEDBACK_ID: feedbackId,
            F2C_SANDBOX_ID: connectSandboxId,
            F2C_OWNER: repositoryConfig.owner,
            F2C_REPO: repositoryConfig.repo,
            F2C_BRANCH: branch,
            GITHUB_APP_PRIVATE_KEY_FILE: "/home/user/.f2c-gh-app-key.pem",
            GITHUB_APP_ID: appId,
            GITHUB_INSTALLATION_ID: installationId,
          },
        },
      );
    } catch (e) {
      console.warn("[e2b webhook] finalize start failed:", e);
    }

    // Do not revoke the callback token here; `finalize-feedback.sh` will
    // send the `completed` callback shortly afterwards.

    return NextResponse.json({ ok: true });
  }

  if (type === "f2c.feedback.agent_failed") {
    if (!feedbackId) {
      return NextResponse.json({ ok: true });
    }

    const authorization = request.headers.get("authorization");
    const token =
      authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
    if (!token) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const authz = await validateMinimaxProxyToken(token);
    if (!authz.ok) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    if (authz.widgetFeedbackId !== feedbackId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    if (
      connectSandboxId &&
      authz.e2bSandboxId &&
      authz.e2bSandboxId !== connectSandboxId
    ) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const exitCode =
      typeof p.exitCode === "string"
        ? p.exitCode
        : typeof p.exitCode === "number"
          ? String(p.exitCode)
          : "?";

    const feedbackRow = await prisma.widgetFeedback.findUnique({
      where: { id: feedbackId },
      select: { repositoryConfigId: true, status: true },
    });

    const repositoryConfig = feedbackRow
      ? await prisma.repositoryConfig.findUnique({
          where: { id: feedbackRow.repositoryConfigId },
          select: { owner: true, repo: true },
        })
      : null;

    const usagePatch = prismaDataFromAgentLlmUsagePayload(p.agentLlmUsage);
    const errMsg = `OpenCode exited with code ${exitCode}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.widgetFeedback as any).updateMany({
      where: { id: feedbackId, status: "CODING" },
      data: {
        status: "FAILED",
        agentError: errMsg.slice(0, 8000),
        agentFinishedAt: new Date(),
        ...usagePatch,
      },
    });

    if (repositoryConfig) {
      revalidatePath(
        dashboardPathForFeedback(repositoryConfig.owner, repositoryConfig.repo),
      );
    }
    revalidatePath(DASHBOARD_HOME);

    if (connectSandboxId) {
      try {
        const sandboxToKill = await Sandbox.connect(connectSandboxId);
        await sandboxToKill.kill();
        console.log("[e2b webhook] sandbox killed after agent_failed callback", {
          feedbackId,
        });
      } catch (e) {
        console.warn("[e2b webhook] failed to kill sandbox after agent_failed:", e);
      }
    }

    await revokeMinimaxProxyTokensForFeedback(feedbackId);

    return NextResponse.json({ ok: true });
  }

  // Optional signature verification (recommended in prod).
  const webhookSecret = process.env.E2B_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authorization = request.headers.get("authorization");
    const expectedBearer = `Bearer ${webhookSecret}`;
    if (authorization !== expectedBearer) {
      const providedSignature = extractProvidedSignature(request);
      const strict =
        isProductionEnv() || process.env.E2B_WEBHOOK_STRICT_SIGNATURE === "true";

      if (!providedSignature) {
        console.warn("[e2b webhook] missing signature header");
        if (strict) return NextResponse.json({ ok: false }, { status: 401 });
      } else if (
        !verifyE2bWebhookSignature(webhookSecret, rawBody, providedSignature)
      ) {
        console.warn("[e2b webhook] signature mismatch (continuing in dev):", {
          strict,
        });
        if (strict) return NextResponse.json({ ok: false }, { status: 401 });
      }
    }
  }

  const candidateIds = [sandboxId, sandboxExecutionId].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = await (prisma.widgetFeedback as any).findFirst({
    where: { e2bSandboxId: { in: candidateIds } },
    select: { id: true, status: true, repositoryConfigId: true, body: true, pagePath: true },
  });

  if (!row) return NextResponse.json({ ok: true });
  if (row.status !== "CODING") return NextResponse.json({ ok: true });

  console.log("[e2b webhook] matched feedback", { feedbackId: row.id, status: row.status });

  // We only care about reads when the sandbox state changes.
  if (type !== "sandbox.lifecycle.updated" && type !== "sandbox.lifecycle.killed") {
    return NextResponse.json({ ok: true });
  }

  const repositoryConfig = await prisma.repositoryConfig.findUnique({
    where: { id: row.repositoryConfigId },
    select: {
      owner: true,
      repo: true,
      receivePrCreatedEmail: true,
      user: { select: { email: true, name: true } },
    },
  });
  if (!repositoryConfig) return NextResponse.json({ ok: true });

  const dashboardPath = dashboardPathForFeedback(
    repositoryConfig.owner,
    repositoryConfig.repo,
  );

  async function attemptReadPrUrlAndUsage(): Promise<{
    prUrl: string | null;
    usageRaw: unknown;
  }> {
    const sandbox = await Sandbox.connect(connectSandboxId!);
    try {
      // `sandbox.lifecycle.updated` can arrive before the PR URL file exists.
      // Poll briefly to give the sandbox time to finish `finalize-feedback.sh`.
      for (let i = 0; i < 40; i++) {
        try {
          const text = await sandbox.files.read(PR_URL_FILE);
          const prUrl = typeof text === "string" ? text.trim() : String(text).trim();
          if (prUrl.length > 0) {
            let usageRaw: unknown;
            try {
              const u = await sandbox.files.read(AGENT_LLM_USAGE_FILE);
              const s = typeof u === "string" ? u : String(u);
              usageRaw = JSON.parse(s);
            } catch {
              usageRaw = undefined;
            }
            return { prUrl, usageRaw };
          }
        } catch {
          /* file not ready yet */
        }

        // 750ms spacing => ~30s total.
        await new Promise((r) => setTimeout(r, 750));
      }

      return { prUrl: null, usageRaw: undefined };
    } finally {
      try {
        // Some SDK versions expose `disconnect`, others rely on GC.
        // This is best-effort to avoid dangling connections.
        // @ts-expect-error - SDK method may not exist.
        await sandbox.disconnect?.();
      } catch {
        /* ignore */
      }
    }
  }

  async function attemptReadUsageOnly(): Promise<unknown> {
    try {
      const sandbox = await Sandbox.connect(connectSandboxId!);
      try {
        const u = await sandbox.files.read(AGENT_LLM_USAGE_FILE);
        const s = typeof u === "string" ? u : String(u);
        return JSON.parse(s);
      } finally {
        try {
          // @ts-expect-error - SDK method may not exist.
          await sandbox.disconnect?.();
        } catch {
          /* ignore */
        }
      }
    } catch {
      return undefined;
    }
  }

  const { prUrl, usageRaw } = await attemptReadPrUrlAndUsage();
  const usagePatch = prismaDataFromAgentLlmUsagePayload(usageRaw);

  if (prUrl && PR_URL_RE.test(prUrl)) {
    console.log("[e2b webhook] PR URL found", { feedbackId: row.id });
    const updated =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma.widgetFeedback as any).updateMany({
      where: { id: row.id, status: "CODING" },
      data: {
        status: "WAITING_FOR_REVIEW",
        prUrl,
        agentFinishedAt: new Date(),
        ...usagePatch,
      },
    });

    if (updated?.count > 0 && repositoryConfig.receivePrCreatedEmail) {
      console.log("[email] attempting PR-created email", {
        prUrl,
        intendedUserEmail: repositoryConfig.user?.email ?? null,
        intendedUserName: repositoryConfig.user?.name ?? null,
        mode: process.env.RESEND_EMAIL_MODE ?? "production",
      });
        await sendPrCreatedEmail({
          intendedToEmails: repositoryConfig.user?.email ? [repositoryConfig.user.email] : [],
          intendedRecipientName: repositoryConfig.user?.name ?? null,
          repositoryFullName: `${repositoryConfig.owner}/${repositoryConfig.repo}`,
          owner: repositoryConfig.owner,
          repo: repositoryConfig.repo,
          prUrl,
          feedbackBody: row.body ?? null,
          pagePath: row.pagePath ?? null,
        });
    }

    revalidatePath(dashboardPath);
    revalidatePath(DASHBOARD_HOME);

    // Stop the sandbox so it doesn't linger after we extracted the PR URL.
    try {
      const sandboxToKill = await Sandbox.connect(connectSandboxId!);
      await sandboxToKill.kill();
      console.log("[e2b webhook] sandbox killed after success", {
        feedbackId: row.id,
      });
    } catch (e) {
      console.warn("[e2b webhook] failed to kill sandbox after success:", e);
    }
    await revokeMinimaxProxyTokensForFeedback(row.id);
    return NextResponse.json({ ok: true });
  }

  if (type === "sandbox.lifecycle.killed") {
    console.log("[e2b webhook] sandbox killed without PR URL", { feedbackId: row.id });
    const usageOnFail = prismaDataFromAgentLlmUsagePayload(await attemptReadUsageOnly());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.widgetFeedback as any).updateMany({
      where: { id: row.id, status: "CODING" },
      data: {
        status: "FAILED",
        agentError: "Sandbox finished but PR URL file was not found or invalid.",
        agentFinishedAt: new Date(),
        ...usageOnFail,
      },
    });
    revalidatePath(dashboardPath);
    revalidatePath(DASHBOARD_HOME);
    await revokeMinimaxProxyTokensForFeedback(row.id);
  }

  return NextResponse.json({ ok: true });
}
