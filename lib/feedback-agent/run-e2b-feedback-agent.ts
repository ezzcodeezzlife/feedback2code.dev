import { buildOpencodeFeedbackPrompt } from "@/lib/feedback-agent/prompt";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Sandbox } from "e2b";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_PATH = "/home/user/feedback-repo";
const E2B_ASSET_DIR = join(process.cwd(), "lib/feedback-agent/e2b");
const SANDBOX_TIMEOUT_MS = 3_600_000; // 1h (E2B hobby max)

export const PR_URL_FILE = "/home/user/f2c-pr-url.txt";

function branchNameForFeedback(feedbackId: string): string {
  const safe = feedbackId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
  return `feedback/f2c-${safe || "item"}`;
}

function revalidateRepo(dashboardPath: string) {
  try {
    revalidatePath(dashboardPath);
    revalidatePath("/");
  } catch {
    /* revalidate may be unavailable outside request scope */
  }
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

function readE2bAsset(name: string): string {
  return readFileSync(join(E2B_ASSET_DIR, name), "utf8");
}

/** Linux bash in E2B breaks on CRLF if the repo was checked out on Windows. */
function lf(s: string) {
  return s.replace(/\r\n/g, "\n");
}

/**
 * Webhook-based runner:
 * - starts the sandbox pipeline in the background so the HTTP request won't block
 * - does NOT update `widgetFeedback` when the agent finishes; that is handled by
 *   the E2B lifecycle webhook route by reading `/home/user/f2c-pr-url.txt`
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
  const prTitle = `Feedback: ${input.feedbackBody.slice(0, 72)}${input.feedbackBody.length > 72 ? "…" : ""}`;
  const pathLine =
    input.pagePath && input.pagePath.length > 0
      ? `Page path: \`${input.pagePath}\`\n\n`
      : "";
  const prBody = `Automated PR from site widget feedback.\n\n${pathLine}---\n\n${input.feedbackBody}`;

  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null;

  try {
    sandbox = await Sandbox.create({
      apiKey: e2bKey,
      timeoutMs: SANDBOX_TIMEOUT_MS,
    });

    await prisma.widgetFeedback.update({
      where: { id: input.feedbackId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { e2bSandboxId: sandbox.sandboxId } as any,
    });

    const pkPem = appPk.includes("\\n") ? appPk.replace(/\\n/g, "\n") : appPk;

    // Assets used inside the VM.
    await sandbox.files.write("/home/user/e2b-github.mjs", lf(readE2bAsset("e2b-github.mjs")));
    await sandbox.files.write("/home/user/bootstrap-clone.sh", lf(readE2bAsset("bootstrap-clone.sh")));
    await sandbox.files.write("/home/user/finalize-feedback.sh", lf(readE2bAsset("finalize-feedback.sh")));
    await sandbox.files.write("/home/user/.f2c-gh-app-key.pem", pkPem);

    // Prompt & PR inputs for OpenCode.
    const opencodeConfig = {
      $schema: "https://opencode.ai/config.json",
      provider: {
        minimax: {
          options: {
            baseURL: "https://api.minimax.io/anthropic/v1",
            apiKey: minimaxKey,
          },
          models: {
            "MiniMax-M2.5": { name: "MiniMax-M2.5" },
          },
        },
      },
      model: "minimax/MiniMax-M2.5",
    };

    await sandbox.files.write(
      "/home/user/.config/opencode/opencode.json",
      JSON.stringify(opencodeConfig, null, 2),
    );

    const repoConfig = await prisma.repositoryConfig.findUnique({
      where: { id: input.repositoryConfigId },
      // Prisma client types can lag behind schema changes during dev (querying a new column).
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
    await sandbox.files.write("/home/user/feedback-prompt.txt", prompt);
    await sandbox.files.write("/home/user/f2c-pr-title.txt", prTitle);
    await sandbox.files.write("/home/user/f2c-pr-body.txt", prBody);

    // Start the full pipeline in the background.
    // NOTE: we don't wait for completion here; webhook handler will read `PR_URL_FILE`.
    const wrapperCmd = `bash -lc 'set -euo pipefail
      chmod +x /home/user/bootstrap-clone.sh /home/user/finalize-feedback.sh
      bash /home/user/bootstrap-clone.sh
      export PATH=\"/usr/local/bin:/usr/bin:$PATH\"
      cd \"${REPO_PATH}\"
      if command -v opencode >/dev/null 2>&1; then OCMD=\"opencode\"; else OCMD=\"npx --yes opencode-ai\"; fi
      \"$OCMD\" run \"$(cat /home/user/feedback-prompt.txt)\" --model \"minimax/MiniMax-M2.5\"
      bash /home/user/finalize-feedback.sh
      rm -f /home/user/.f2c-gh-app-key.pem /home/user/e2b-github.mjs /home/user/bootstrap-clone.sh /home/user/finalize-feedback.sh || true
    '`;

    const publicBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      process.env.APP_URL?.replace(/\/$/, "") ??
      "";
    const webhookUrl = publicBase ? `${publicBase}/api/e2b/webhook` : "";

    await sandbox.commands.run(wrapperCmd, {
      background: true,
      timeoutMs: SANDBOX_TIMEOUT_MS,
      envs: {
        F2C_WEBHOOK_URL: webhookUrl,
        F2C_WEBHOOK_SECRET: process.env.E2B_WEBHOOK_SECRET ?? "",
        F2C_FEEDBACK_ID: input.feedbackId,
        F2C_SANDBOX_ID: sandbox.sandboxId,
        GITHUB_APP_PRIVATE_KEY_FILE: "/home/user/.f2c-gh-app-key.pem",
        GITHUB_APP_ID: appId,
        GITHUB_INSTALLATION_ID: input.githubInstallationId,
        F2C_OWNER: input.owner,
        F2C_REPO: input.repo,
        F2C_BRANCH: branch,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markFailed(input.feedbackId, msg, dash);
    return;
  } finally {
    // Intentionally do NOT kill the sandbox here; webhook handler needs it to read `PR_URL_FILE`.
  }
}
