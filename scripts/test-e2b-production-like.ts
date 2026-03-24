/**
 * Runs the same E2B pipeline as production (clone → OpenCode + MiniMax → push + PR), blocking until done.
 *
 * Requires the usual app secrets in env (see README) plus:
 *   E2B_TEST_OWNER, E2B_TEST_REPO, E2B_TEST_GITHUB_INSTALLATION_ID
 *
 * Optional: E2B_TEST_FULL_NAME, E2B_TEST_FEEDBACK_BODY, E2B_TEST_FEEDBACK_ID,
 * E2B_TEST_TIMEOUT_MS (default 900000), E2B_TEST_CUSTOM_INSTRUCTIONS
 *
 * Run: npm run test:e2b-production-like
 *
 * The sandbox calls your app at NEXT_PUBLIC_APP_URL for the MiniMax HTTP proxy; that URL must be
 * reachable from E2B (e.g. tunnel or deploy). Warning: can open a real PR; use a disposable fork/repo.
 */
import { runE2bFeedbackAgentBlockingIntegrationTest } from "@/lib/feedback-agent/e2b-feedback-pipeline-core";

const owner = process.env.E2B_TEST_OWNER?.trim();
const repo = process.env.E2B_TEST_REPO?.trim();
const installationId = process.env.E2B_TEST_GITHUB_INSTALLATION_ID?.trim();

if (!owner || !repo || !installationId) {
  console.error(
    "Set E2B_TEST_OWNER, E2B_TEST_REPO, and E2B_TEST_GITHUB_INSTALLATION_ID (numeric installation id for your GitHub App on that repo).",
  );
  process.exit(1);
}

const fullName = process.env.E2B_TEST_FULL_NAME?.trim() || `${owner}/${repo}`;
const feedbackBody =
  process.env.E2B_TEST_FEEDBACK_BODY?.trim() ||
  "Smoke test only: add a file named E2B_SMOKE_TEST.md whose entire content is the single line: ok, then commit. Do not change anything else.";
const feedbackId =
  process.env.E2B_TEST_FEEDBACK_ID?.trim() || `e2bsmoke${Date.now()}`;
const timeoutRaw = process.env.E2B_TEST_TIMEOUT_MS?.trim();
const timeoutMs =
  timeoutRaw && !Number.isNaN(Number(timeoutRaw)) ? Number(timeoutRaw) : 900_000;
const customInstructions = process.env.E2B_TEST_CUSTOM_INSTRUCTIONS?.trim() || null;

void (async () => {
  console.log("production-like E2B run", { fullName, feedbackId, timeoutMs });
  const out = await runE2bFeedbackAgentBlockingIntegrationTest({
    feedbackId,
    owner,
    repo,
    fullName,
    feedbackBody,
    pagePath: null,
    githubInstallationId: installationId,
    customInstructions,
    timeoutMs,
  });
  console.log("sandboxId:", out.sandboxId);
  console.log("exitCode:", out.exitCode);
  console.log("prUrl:", out.prUrl ?? "(none)");
  if (out.stderr.trim()) {
    console.error("stderr (tail):", out.stderr.slice(-12_000));
  }
  if (out.stdout.trim()) {
    console.log("stdout (tail):", out.stdout.slice(-8000));
  }
  process.exit(out.exitCode === 0 ? 0 : 1);
})();
