import { buildFeedbackAgentEgressAllowOut } from "@/lib/feedback-agent/e2b-sandbox-network";
import {
  buildFeedbackPrBody,
  buildFeedbackPrTitle,
} from "@/lib/feedback-agent/feedback-pr-copy";
import { buildOpencodeFeedbackPrompt } from "@/lib/feedback-agent/prompt";
import { ALL_TRAFFIC, Sandbox } from "e2b";
import type { CommandResult } from "e2b";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_PATH = "/home/user/feedback-repo";
const E2B_ASSET_DIR = join(process.cwd(), "lib/feedback-agent/e2b");

/**
 * Optional: E2B template alias/ID built with lower `--memory-mb` / `--cpu-count`.
 * The public `base` template is already 512 MiB; smaller sandboxes require your own template (often Pro).
 */
export function feedbackSandboxTemplate(): string | undefined {
  const t = process.env.E2B_FEEDBACK_SANDBOX_TEMPLATE?.trim();
  return t || undefined;
}

export const PR_URL_FILE = "/home/user/f2c-pr-url.txt";
export const AGENT_LLM_USAGE_FILE = "/home/user/f2c-agent-llm-usage.json";

export function branchNameForFeedback(feedbackId: string): string {
  const safe = feedbackId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24);
  return `feedback/f2c-${safe || "item"}`;
}

function readE2bAsset(name: string): string {
  return readFileSync(join(E2B_ASSET_DIR, name), "utf8");
}

/** Linux bash in E2B breaks on CRLF if the repo was checked out on Windows. */
function lf(s: string) {
  return s.replace(/\r\n/g, "\n");
}

function publicAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.APP_URL?.replace(/\/$/, "") ??
    ""
  );
}

export function feedbackPipelineWrapperCmd(): string {
  return `bash -lc 'set -euo pipefail
      chmod +x /home/user/bootstrap-clone.sh /home/user/finalize-feedback.sh
      bash /home/user/bootstrap-clone.sh
      export PATH=\"/usr/local/bin:/usr/bin:$PATH\"
      export F2C_REPO_PATH=\"${REPO_PATH}\"
      cd \"${REPO_PATH}\"
      if command -v opencode >/dev/null 2>&1; then OCMD=\"opencode\"; else OCMD=\"npx --yes opencode-ai\"; fi
      set +e
      \"$OCMD\" run \"$(cat /home/user/feedback-prompt.txt)\" --model \"minimax/MiniMax-M2.5\"
      OC_EXIT=$?
      set -e
      node /home/user/collect-opencode-usage.mjs || true
      if [ \"$OC_EXIT\" -ne 0 ]; then
        node /home/user/f2c-notify-webhook.mjs failed \"$OC_EXIT\" || true
        exit \"$OC_EXIT\"
      fi
      bash /home/user/finalize-feedback.sh
      rm -f /home/user/.f2c-gh-app-key.pem /home/user/e2b-github.mjs /home/user/bootstrap-clone.sh /home/user/finalize-feedback.sh /home/user/collect-opencode-usage.mjs /home/user/f2c-notify-webhook.mjs /home/user/f2c-agent-llm-usage.json || true
    '`;
}

export function feedbackPipelineEnvs(input: {
  feedbackId: string;
  sandboxId: string;
  owner: string;
  repo: string;
  branch: string;
  githubInstallationId: string;
  appId: string;
  webhookUrl: string;
}): Record<string, string> {
  return {
    F2C_WEBHOOK_URL: input.webhookUrl,
    F2C_WEBHOOK_SECRET: process.env.E2B_WEBHOOK_SECRET ?? "",
    F2C_FEEDBACK_ID: input.feedbackId,
    F2C_SANDBOX_ID: input.sandboxId,
    GITHUB_APP_PRIVATE_KEY_FILE: "/home/user/.f2c-gh-app-key.pem",
    GITHUB_APP_ID: input.appId,
    GITHUB_INSTALLATION_ID: input.githubInstallationId,
    F2C_OWNER: input.owner,
    F2C_REPO: input.repo,
    F2C_BRANCH: input.branch,
  };
}

export async function writeFeedbackSandboxFiles(
  sandbox: Awaited<ReturnType<typeof Sandbox.create>>,
  params: {
    minimaxKey: string;
    appPk: string;
    branch: string;
    prTitle: string;
    prBody: string;
    prompt: string;
  },
): Promise<void> {
  const pkPem = params.appPk.includes("\\n") ? params.appPk.replace(/\\n/g, "\n") : params.appPk;

  await sandbox.files.write("/home/user/e2b-github.mjs", lf(readE2bAsset("e2b-github.mjs")));
  await sandbox.files.write("/home/user/bootstrap-clone.sh", lf(readE2bAsset("bootstrap-clone.sh")));
  await sandbox.files.write("/home/user/finalize-feedback.sh", lf(readE2bAsset("finalize-feedback.sh")));
  await sandbox.files.write("/home/user/collect-opencode-usage.mjs", lf(readE2bAsset("collect-opencode-usage.mjs")));
  await sandbox.files.write("/home/user/f2c-notify-webhook.mjs", lf(readE2bAsset("f2c-notify-webhook.mjs")));
  await sandbox.files.write("/home/user/.f2c-gh-app-key.pem", pkPem);

  const opencodeConfig = {
    $schema: "https://opencode.ai/config.json",
    provider: {
      minimax: {
        options: {
          baseURL: "https://api.minimax.io/anthropic/v1",
          apiKey: params.minimaxKey,
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
  await sandbox.files.write("/home/user/feedback-prompt.txt", params.prompt);
  await sandbox.files.write("/home/user/f2c-pr-title.txt", params.prTitle);
  await sandbox.files.write("/home/user/f2c-pr-body.txt", params.prBody);
}

export function createSandboxOpts(e2bKey: string, timeoutMs: number) {
  const publicBase = publicAppBaseUrl();
  const webhookUrl = publicBase ? `${publicBase}/api/e2b/webhook` : "";
  const egressAllowOut = buildFeedbackAgentEgressAllowOut(webhookUrl);
  return {
    apiKey: e2bKey,
    timeoutMs,
    /** Must be false when using deny-all + allowOut; leaving default true can conflict with egress rules. */
    allowInternetAccess: false,
    network: {
      denyOut: [ALL_TRAFFIC],
      allowOut: egressAllowOut,
    },
  };
}

/**
 * Runs the same bash pipeline as production (bootstrap → OpenCode → finalize) and waits for it.
 * Creates a real branch/PR on GitHub if the agent commits. Kills the sandbox when done.
 * Import from this module in CLI scripts (no Prisma / server-only).
 */
export async function runE2bFeedbackAgentBlockingIntegrationTest(input: {
  feedbackId: string;
  owner: string;
  repo: string;
  fullName: string;
  feedbackBody: string;
  pagePath: string | null;
  pageUrl?: string | null;
  githubInstallationId: string;
  customInstructions?: string | null;
  timeoutMs?: number;
}): Promise<{
  sandboxId: string;
  exitCode: number;
  prUrl: string | null;
  stdout: string;
  stderr: string;
}> {
  const e2bKey = process.env.E2B_API_KEY;
  const minimaxKey = process.env.MINIMAX_API_KEY;
  const appId = process.env.GITHUB_APP_ID;
  const appPk = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!e2bKey || !minimaxKey) {
    throw new Error("Set E2B_API_KEY and MINIMAX_API_KEY");
  }
  if (!appId || !appPk?.trim()) {
    throw new Error("Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY");
  }

  const timeoutMs = input.timeoutMs ?? 900_000; // 15m default for integration test
  const publicBase = publicAppBaseUrl();
  const webhookUrl = publicBase ? `${publicBase}/api/e2b/webhook` : "";

  const branch = branchNameForFeedback(input.feedbackId);
  const prTitle = buildFeedbackPrTitle(input.feedbackBody);
  const prBody = buildFeedbackPrBody({
    feedbackBody: input.feedbackBody,
    pagePath: input.pagePath,
    pageUrl: input.pageUrl ?? null,
    owner: input.owner,
    repo: input.repo,
  });

  const prompt = buildOpencodeFeedbackPrompt({
    owner: input.owner,
    repo: input.repo,
    fullName: input.fullName,
    feedbackBody: input.feedbackBody,
    branchName: branch,
    customInstructions: input.customInstructions ?? null,
    pagePath: input.pagePath,
  });

  const template = feedbackSandboxTemplate();
  const sandboxOpts = createSandboxOpts(e2bKey, timeoutMs);
  const sandbox = template
    ? await Sandbox.create(template, sandboxOpts)
    : await Sandbox.create(sandboxOpts);

  try {
    await writeFeedbackSandboxFiles(sandbox, {
      minimaxKey,
      appPk,
      branch,
      prTitle,
      prBody,
      prompt,
    });

    const result = (await sandbox.commands.run(feedbackPipelineWrapperCmd(), {
      background: false,
      timeoutMs,
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
    })) as CommandResult;

    let prUrl: string | null = null;
    if (result.exitCode === 0) {
      try {
        const raw = await sandbox.files.read(PR_URL_FILE);
        const t = raw.trim();
        prUrl = t.length > 0 ? t : null;
      } catch {
        prUrl = null;
      }
    }

    return {
      sandboxId: sandbox.sandboxId,
      exitCode: result.exitCode,
      prUrl,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } finally {
    await Sandbox.kill(sandbox.sandboxId, { apiKey: e2bKey });
  }
}
