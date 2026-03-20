import { buildOpencodeFeedbackPrompt } from "@/lib/feedback-agent/prompt";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CommandExitError, Sandbox } from "e2b";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_PATH = "/home/user/feedback-repo";
const E2B_ASSET_DIR = join(process.cwd(), "lib/feedback-agent/e2b");
const SANDBOX_TIMEOUT_MS = 3_600_000; // 1h (E2B hobby max)
const INSTALL_TIMEOUT_MS = 420_000;
const OPENCODE_TIMEOUT_MS = 2_400_000; // 40 min
const FINALIZE_TIMEOUT_MS = 300_000;

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

async function markSuccess(
  feedbackId: string,
  prUrl: string,
  dashboardPath: string,
): Promise<void> {
  await prisma.widgetFeedback.update({
    where: { id: feedbackId },
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: "WAITING_FOR_REVIEW" as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prUrl: prUrl as any,
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

/** Last line may be PR URL if git or other tools polluted stdout before create-pr. */
function extractGithubPullRequestUrl(text: string): string | null {
  const matches = text.matchAll(
    /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+/g,
  );
  let last: string | null = null;
  for (const m of matches) {
    last = m[0];
  }
  return last;
}

function githubPushDeniedHint(detail: string): string {
  const d = detail.toLowerCase();
  if (
    !d.includes("403") &&
    !d.includes("denied") &&
    !d.includes("permission")
  ) {
    return "";
  }
  return (
    " On GitHub: open your GitHub App → Permissions & events and set Contents + Pull requests to Read & write, save, then reinstall/accept the update. " +
    "Under Install settings, ensure this repository is included (All repositories, or the list contains it). " +
    "Orgs may need to allow the app under Third-party access."
  );
}

type SandboxWithCommands = {
  commands: {
    run: (
      cmd: string,
      opts?: { timeoutMs?: number; envs?: Record<string, string> },
    ) => Promise<unknown>;
  };
};

function scrubGithubAppKey(sandbox: SandboxWithCommands): void {
  void sandbox.commands
    .run(
      "bash -lc 'rm -f /home/user/.f2c-gh-app-key.pem /home/user/e2b-github.mjs /home/user/bootstrap-clone.sh /home/user/finalize-feedback.sh'",
      { timeoutMs: 30_000 },
    )
    .catch(() => {});
}

async function runSandboxCommand(
  sandbox: SandboxWithCommands,
  cmd: string,
  opts: { timeoutMs: number; envs?: Record<string, string> },
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  try {
    const r = (await sandbox.commands.run(cmd, opts)) as {
      exitCode: number;
      stdout: string;
      stderr: string;
    };
    return r;
  } catch (e) {
    if (e instanceof CommandExitError) {
      return {
        exitCode: e.exitCode,
        stdout: e.stdout,
        stderr: e.stderr,
      };
    }
    throw e;
  }
}

/**
 * E2B sandbox: GitHub App JWT + installation token minted only inside the sandbox (see e2b-github.mjs).
 * Git remotes are scrubbed before OpenCode runs so the agent never sees credentials in .git/config.
 */
export async function runE2bFeedbackAgent(input: {
  feedbackId: string;
  owner: string;
  repo: string;
  fullName: string;
  feedbackBody: string;
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
  const prBody = `Automated PR from site widget feedback.\n\n---\n\n${input.feedbackBody}`;

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

    await sandbox.files.write("/home/user/e2b-github.mjs", lf(readE2bAsset("e2b-github.mjs")));
    await sandbox.files.write(
      "/home/user/bootstrap-clone.sh",
      lf(readE2bAsset("bootstrap-clone.sh")),
    );
    await sandbox.files.write(
      "/home/user/finalize-feedback.sh",
      lf(readE2bAsset("finalize-feedback.sh")),
    );
    await sandbox.files.write("/home/user/.f2c-gh-app-key.pem", pkPem);
    await runSandboxCommand(sandbox, "bash -lc 'chmod 600 /home/user/.f2c-gh-app-key.pem'", {
      timeoutMs: 30_000,
    });

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

    const prompt = buildOpencodeFeedbackPrompt({
      owner: input.owner,
      repo: input.repo,
      fullName: input.fullName,
      feedbackBody: input.feedbackBody,
      branchName: branch,
    });
    await sandbox.files.write("/home/user/feedback-prompt.txt", prompt);
    await sandbox.files.write("/home/user/f2c-pr-title.txt", prTitle);
    await sandbox.files.write("/home/user/f2c-pr-body.txt", prBody);

    await runSandboxCommand(
      sandbox,
      "bash -lc 'chmod +x /home/user/bootstrap-clone.sh /home/user/finalize-feedback.sh'",
      { timeoutMs: 30_000 },
    );

    const bootstrap = await runSandboxCommand(sandbox, "bash /home/user/bootstrap-clone.sh", {
      timeoutMs: INSTALL_TIMEOUT_MS,
      envs: {
        GITHUB_APP_PRIVATE_KEY_FILE: "/home/user/.f2c-gh-app-key.pem",
        GITHUB_APP_ID: appId,
        GITHUB_INSTALLATION_ID: input.githubInstallationId,
        F2C_OWNER: input.owner,
        F2C_REPO: input.repo,
        F2C_BRANCH: branch,
      },
    });
    if (bootstrap.exitCode !== 0) {
      await markFailed(
        input.feedbackId,
        `Bootstrap/clone failed: ${bootstrap.stderr?.slice(0, 2000) ?? bootstrap.stdout?.slice(0, 2000) ?? "unknown"}`,
        dash,
      );
      return;
    }

    const runAgent = await runSandboxCommand(
      sandbox,
      `bash -lc 'set -euo pipefail
        cd "${REPO_PATH}"
        export PATH="/usr/local/bin:/usr/bin:$PATH"
        if command -v opencode >/dev/null 2>&1; then
          OCMD="opencode"
        else
          OCMD="npx --yes opencode-ai"
        fi
        "$OCMD" run "$(cat /home/user/feedback-prompt.txt)" --model "minimax/MiniMax-M2.5"
      '`,
      { timeoutMs: OPENCODE_TIMEOUT_MS },
    );
    if (runAgent.exitCode !== 0) {
      await markFailed(
        input.feedbackId,
        `OpenCode exited ${runAgent.exitCode}: ${runAgent.stderr?.slice(0, 4000) ?? runAgent.stdout?.slice(0, 2000) ?? "unknown"}`,
        dash,
      );
      return;
    }

    const finalize = await runSandboxCommand(sandbox, "bash /home/user/finalize-feedback.sh", {
      timeoutMs: FINALIZE_TIMEOUT_MS,
      envs: {
        GITHUB_APP_PRIVATE_KEY_FILE: "/home/user/.f2c-gh-app-key.pem",
        GITHUB_APP_ID: appId,
        GITHUB_INSTALLATION_ID: input.githubInstallationId,
        F2C_OWNER: input.owner,
        F2C_REPO: input.repo,
        F2C_BRANCH: branch,
      },
    });

    const out = (finalize.stdout ?? "").trim();
    const combined = [finalize.stdout, finalize.stderr]
      .filter((s): s is string => !!s?.trim())
      .join("\n");
    const prUrl =
      extractGithubPullRequestUrl(out) ?? extractGithubPullRequestUrl(combined);

    if (finalize.exitCode === 2 || out === "NO_COMMITS") {
      await markFailed(
        input.feedbackId,
        "The agent finished but produced no commits on the branch. Check the feedback scope or OpenCode logs.",
        dash,
      );
      return;
    }

    if (prUrl) {
      await markSuccess(input.feedbackId, prUrl, dash);
      return;
    }

    if (finalize.exitCode === 0 && !prUrl) {
      await markFailed(
        input.feedbackId,
        `Finalize finished but no PR URL was found in output: ${combined.slice(0, 2000)}`,
        dash,
      );
      return;
    }

    const detail = combined.slice(0, 4000) || "unknown";
    await markFailed(
      input.feedbackId,
      `Finalize/push/PR failed: ${detail}${githubPushDeniedHint(detail)}`,
      dash,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await markFailed(input.feedbackId, msg, dash);
  } finally {
    if (sandbox) {
      scrubGithubAppKey(sandbox);
      try {
        await sandbox.kill();
      } catch {
        /* ignore */
      }
    }
  }
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
  owner: string;
  repo: string;
  fullName: string;
  feedbackBody: string;
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
  const prBody = `Automated PR from site widget feedback.\n\n---\n\n${input.feedbackBody}`;

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

    const prompt = buildOpencodeFeedbackPrompt({
      owner: input.owner,
      repo: input.repo,
      fullName: input.fullName,
      feedbackBody: input.feedbackBody,
      branchName: branch,
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
