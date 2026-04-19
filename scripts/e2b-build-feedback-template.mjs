/**
 * Publishes the feedback-agent E2B template (CLI requires E2B_ACCESS_TOKEN).
 * @see https://e2b.dev/docs/cli/auth
 *
 * Loads: `.env.development` (E2B_API_KEY), then optional `.env.e2b.cli` (E2B_ACCESS_TOKEN).
 * Run: npm run e2b:build-feedback-template
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");

config({ path: path.join(root, ".env.development") });
if (existsSync(path.join(root, ".env.e2b.cli"))) {
  config({ path: path.join(root, ".env.e2b.cli") });
}

const apiKey = process.env.E2B_API_KEY?.trim();
const accessToken = process.env.E2B_ACCESS_TOKEN?.trim();

if (!apiKey) {
  console.error("Missing E2B_API_KEY (set in .env.development).");
  process.exit(1);
}
if (!accessToken) {
  console.warn(
    "No E2B_ACCESS_TOKEN in .env.development / .env.e2b.cli — using CLI default auth (e.g. `npx @e2b/cli auth login`).\n",
  );
}

const cmd = [
  "npx",
  "@e2b/cli",
  "template",
  "create",
  "feedback2code-agent",
  "--dockerfile",
  "e2b/feedback-agent/e2b.Dockerfile",
  "--cpu-count",
  "2",
  "--memory-mb",
  "2048",
].join(" ");

try {
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      E2B_API_KEY: apiKey,
      ...(accessToken ? { E2B_ACCESS_TOKEN: accessToken } : {}),
    },
    shell: true,
  });
} catch {
  console.error(
    [
      "",
      "If you saw \"You must be logged in\":",
      "  • Copy .env.e2b.cli.example → .env.e2b.cli and set E2B_ACCESS_TOKEN (https://e2b.dev/docs/api-key), or",
      "  • Run `npx @e2b/cli auth login` in this machine's terminal, then re-run `npm run e2b:build-feedback-template`.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
