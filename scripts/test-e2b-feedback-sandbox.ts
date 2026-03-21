/**
 * Verifies E2B sandbox egress: allowed hosts reach TLS; arbitrary internet does not.
 * Run: npx dotenv-cli -e .env.development -- npx tsx scripts/test-e2b-feedback-sandbox.ts
 */
import { ALL_TRAFFIC, CommandExitError, Sandbox } from "e2b";
import { buildFeedbackAgentEgressAllowOut } from "@/lib/feedback-agent/e2b-sandbox-network";

const apiKey = process.env.E2B_API_KEY;
if (!apiKey) {
  console.error("Missing E2B_API_KEY");
  process.exit(1);
}

const publicBase =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  process.env.APP_URL?.replace(/\/$/, "") ??
  "";
const webhookUrl = publicBase ? `${publicBase}/api/e2b/webhook` : "";
const allowOut = buildFeedbackAgentEgressAllowOut(webhookUrl);
const template = process.env.E2B_FEEDBACK_SANDBOX_TEMPLATE?.trim();

async function main() {
  console.log("allowOut count:", allowOut.length);
  const createOpts = {
    apiKey,
    timeoutMs: 120_000,
    allowInternetAccess: false,
    network: { denyOut: [ALL_TRAFFIC], allowOut },
  };

  const sandbox = template
    ? await Sandbox.create(template, createOpts)
    : await Sandbox.create(createOpts);

  try {
    const okGithub = await sandbox.commands.run(
      "curl -sS -I --max-time 15 https://api.github.com/",
      { timeoutMs: 30_000 },
    );
    if (okGithub.exitCode !== 0) {
      console.error("expected api.github.com to succeed", okGithub.stderr);
      process.exitCode = 1;
      return;
    }
    console.log("ok: api.github.com reachable");

    const okMini = await sandbox.commands.run(
      "curl -sS -I --max-time 15 https://api.minimax.io/",
      { timeoutMs: 30_000 },
    );
    if (okMini.exitCode !== 0) {
      console.error("expected api.minimax.io to succeed", okMini.stderr);
      process.exitCode = 1;
      return;
    }
    console.log("ok: api.minimax.io reachable");

    try {
      await sandbox.commands.run("curl -sS -I --max-time 10 https://example.com/", {
        timeoutMs: 20_000,
      });
      console.error("expected example.com to be blocked but curl succeeded");
      process.exitCode = 1;
      return;
    } catch (e) {
      if (e instanceof CommandExitError && e.exitCode !== 0) {
        console.log("ok: example.com blocked (curl failed as expected)");
      } else {
        throw e;
      }
    }
  } finally {
    await Sandbox.kill(sandbox.sandboxId, { apiKey });
    console.log("sandbox killed:", sandbox.sandboxId);
  }
}

void main();
