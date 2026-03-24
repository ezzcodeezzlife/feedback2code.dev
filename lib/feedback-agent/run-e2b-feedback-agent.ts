import { DASHBOARD_HOME } from "@/lib/app-paths";
import {
  branchNameForFeedback,
  createSandboxOpts,
  feedbackPipelineEnvs,
  feedbackPipelineWrapperCmd,
  feedbackSandboxTemplate,
  writeFeedbackSandboxFiles,
} from "@/lib/feedback-agent/e2b-feedback-pipeline-core";
import {
  buildFeedbackPrBody,
  buildFeedbackPrTitle,
} from "@/lib/feedback-agent/feedback-pr-copy";
import { buildOpencodeFeedbackPrompt } from "@/lib/feedback-agent/prompt";
import {
  mintMinimaxProxyTokenForFeedback,
  revokeMinimaxProxyTokensForFeedback,
} from "@/lib/feedback-agent/minimax-proxy-token";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Sandbox } from "e2b";

const SANDBOX_TIMEOUT_MS = 3_600_000; // 1h (E2B hobby max)

export {
  PR_URL_FILE,
  AGENT_LLM_USAGE_FILE,
  branchNameForFeedback,
} from "@/lib/feedback-agent/e2b-feedback-pipeline-core";
export { runE2bFeedbackAgentBlockingIntegrationTest } from "@/lib/feedback-agent/e2b-feedback-pipeline-core";

function revalidateRepo(dashboardPath: string) {
  try {
    revalidatePath(dashboardPath);
    revalidatePath(DASHBOARD_HOME);
  } catch {
    /* revalidate may be unavailable outside request scope */
  }
}

function formatStartError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const parts = [e.message];
  let c: unknown = e.cause;
  let depth = 0;
  while (c instanceof Error && depth++ < 5) {
    parts.push(c.message);
    c = c.cause;
  }
  return parts.filter(Boolean).join(" | ");
}

async function markFailed(
  feedbackId: string,
  message: string,
  dashboardPath: string,
): Promise<void> {
  await prisma.widgetFeedback.update({
    where: { id: feedbackId },
    data: {
      // Prisma client types appear temporarily out of sync with the schema fields.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: "FAILED" as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      agentError: message.slice(0, 8000) as any,
      agentFinishedAt: new Date(),
    },
  });
  revalidateRepo(dashboardPath);
}

function publicAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.APP_URL?.replace(/\/$/, "") ??
    ""
  );
}

/**
 * Webhook-based runner:
 * - Creates the sandbox, writes files, then runs the bash pipeline with **`background: true`**
 *   (returns once the VM process is started — **not** when OpenCode / PR work finishes).
 * - Completion is reported via `/api/e2b/webhook` (and the in-sandbox POST callback).
 *
 * The sandbox is left to complete on its own (up to `SANDBOX_TIMEOUT_MS`).
 */
export async function startE2bFeedbackAgentWebhook(input: {
  feedbackId: string;
  repositoryConfigId: string;
  owner: string;
  repo: string;
  fullName: string;
  feedbackBody: string;
  pagePath: string | null;
  pageUrl: string | null;
  dashboardPath: string;
  githubInstallationId: string | null;
}): Promise<void> {
  const dash = input.dashboardPath;
  const e2bKey = process.env.E2B_API_KEY;
  const minimaxKey = process.env.MINIMAX_API_KEY;
  const appId = process.env.GITHUB_APP_ID;
  const appPk = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!e2bKey || !minimaxKey) {
    await markFailed(
      input.feedbackId,
      "Automation disabled or misconfigured: set E2B_API_KEY and MINIMAX_API_KEY on the server.",
      dash,
    );
    return;
  }

  if (!appId || !appPk?.trim()) {
    await markFailed(
      input.feedbackId,
      "Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY (used inside the sandbox only, not passed to OpenCode).",
      dash,
    );
    return;
  }

  if (!input.githubInstallationId) {
    await markFailed(
      input.feedbackId,
      "No GitHub App installation for this account. Install the app from the dashboard so the sandbox can mint tokens for your repos.",
      dash,
    );
    return;
  }

  const branch = branchNameForFeedback(input.feedbackId);
  const prTitle = buildFeedbackPrTitle(input.feedbackBody);
  const prBody = buildFeedbackPrBody({
    feedbackBody: input.feedbackBody,
    pagePath: input.pagePath,
    pageUrl: input.pageUrl,
    owner: input.owner,
    repo: input.repo,
  });

  const publicBase = publicAppBaseUrl();
  if (!publicBase) {
    await markFailed(
      input.feedbackId,
      "Set NEXT_PUBLIC_APP_URL (or APP_URL) so the sandbox can reach the MiniMax HTTP proxy.",
      dash,
    );
    return;
  }
  const webhookUrl = `${publicBase}/api/e2b/webhook`;
  const sandboxOpts = createSandboxOpts(e2bKey, SANDBOX_TIMEOUT_MS);

  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null;

  try {
    const template = feedbackSandboxTemplate();
    sandbox = template
      ? await Sandbox.create(template, sandboxOpts)
      : await Sandbox.create(sandboxOpts);

    await prisma.widgetFeedback.update({
      where: { id: input.feedbackId },
      // Prisma client types can lag behind schema changes during dev (querying a new column).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { e2bSandboxId: sandbox.sandboxId } as any,
    });

    const repoConfig = await prisma.repositoryConfig.findUnique({
      where: { id: input.repositoryConfigId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: { customInstructions: true } as any,
    });

    const customInstructions = (repoConfig as
      | { customInstructions?: string | null }
      | null)?.customInstructions;

    const prompt = buildOpencodeFeedbackPrompt({
      owner: input.owner,
      repo: input.repo,
      fullName: input.fullName,
      feedbackBody: input.feedbackBody,
      branchName: branch,
      customInstructions: customInstructions ?? null,
      pagePath: input.pagePath,
    });

    const { plainToken } = await mintMinimaxProxyTokenForFeedback({
      widgetFeedbackId: input.feedbackId,
      e2bSandboxId: sandbox.sandboxId,
    });

    await writeFeedbackSandboxFiles(sandbox, {
      minimaxProxy: {
        baseURL: `${publicBase}/api/agent/minimax-proxy/anthropic/v1`,
        apiKey: plainToken,
      },
      appPk,
      branch,
      prTitle,
      prBody,
      prompt,
    });

    await sandbox.commands.run(feedbackPipelineWrapperCmd(), {
      background: true,
      timeoutMs: SANDBOX_TIMEOUT_MS,
      envs: feedbackPipelineEnvs({
        feedbackId: input.feedbackId,
        sandboxId: sandbox.sandboxId,
        owner: input.owner,
        repo: input.repo,
        branch,
        githubInstallationId: input.githubInstallationId,
        appId,
        webhookUrl,
      }),
    });
  } catch (e) {
    await revokeMinimaxProxyTokensForFeedback(input.feedbackId);
    await markFailed(input.feedbackId, formatStartError(e), dash);
    return;
  } finally {
    // Intentionally do NOT kill the sandbox here; webhook handler needs it to read `PR_URL_FILE`.
  }
}
