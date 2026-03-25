import http from "node:http";
import https from "node:https";
import { readFileSync } from "node:fs";
import { URL } from "node:url";

const USAGE_PATH = "/home/user/f2c-agent-llm-usage.json";

function loadUsage() {
  try {
    return JSON.parse(readFileSync(USAGE_PATH, "utf8"));
  } catch {
    return null;
  }
}

function postJson(urlStr, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const isHttps = u.protocol === "https:";
    const lib = isHttps ? https : http;
    const port =
      u.port || (isHttps ? 443 : 80);
    const req = lib.request(
      {
        hostname: u.hostname,
        port,
        path: u.pathname + u.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          Authorization: `Bearer ${process.env.F2C_WEBHOOK_SECRET ?? ""}`,
        },
      },
      (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const url = process.env.F2C_WEBHOOK_URL;
const secret = process.env.F2C_WEBHOOK_SECRET;
const feedbackId = process.env.F2C_FEEDBACK_ID;

if (!url || !secret || !feedbackId) {
  process.exit(0);
}

const mode = process.argv[2];
const usage = loadUsage();
const sandboxId = process.env.F2C_SANDBOX_ID ?? "";

let body;
if (mode === "completed") {
  const prUrl = process.argv[3] || "";
  body = JSON.stringify({
    type: "f2c.feedback.completed",
    feedbackId,
    sandboxId,
    prUrl,
    agentLlmUsage: usage,
  });
} else if (mode === "needs_finalize") {
  body = JSON.stringify({
    type: "f2c.feedback.needs_finalize",
    feedbackId,
    sandboxId,
    agentLlmUsage: usage,
  });
} else if (mode === "failed") {
  const exitCode = process.argv[3] ?? "1";
  body = JSON.stringify({
    type: "f2c.feedback.agent_failed",
    feedbackId,
    sandboxId,
    exitCode: String(exitCode),
    agentLlmUsage: usage,
  });
} else {
  process.exit(0);
}

postJson(url, body)
  .catch(() => {})
  .finally(() => process.exit(0));
