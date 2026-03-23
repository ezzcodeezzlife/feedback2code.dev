import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const REPO = process.env.F2C_REPO_PATH || "/home/user/feedback-repo";
const OUT = "/home/user/f2c-agent-llm-usage.json";
const MAX_BUFFER = 100 * 1024 * 1024;

function ocBaseArgs() {
  const r = spawnSync("bash", [
    "-lc",
    "command -v opencode >/dev/null 2>&1 && echo opencode || echo npx",
  ], { encoding: "utf8" });
  const w = (r.stdout || "").trim().split("\n")[0];
  if (w === "opencode") return ["opencode"];
  return ["npx", "--yes", "opencode-ai"];
}

function runOc(base, sub) {
  return spawnSync(base[0], [...base.slice(1), ...sub], {
    encoding: "utf8",
    cwd: REPO,
    env: { ...process.env, HOME: "/home/user" },
    maxBuffer: MAX_BUFFER,
  });
}

function aggregateExport(data) {
  const info = data && typeof data === "object" ? data.info || {} : {};
  const messages = Array.isArray(data?.messages) ? data.messages : [];

  let costUsd = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let reasoningTokens = 0;
  let cacheRead = 0;
  let cacheWrite = 0;
  let totalTokens = 0;
  let assistantTurns = 0;
  let providerId;
  let modelId;

  for (const msg of messages) {
    const i = msg?.info;
    if (!i || i.role !== "assistant") continue;
    assistantTurns += 1;
    if (typeof i.cost === "number" && Number.isFinite(i.cost)) costUsd += i.cost;
    const t = i.tokens;
    if (t && typeof t === "object") {
      if (typeof t.input === "number" && Number.isFinite(t.input)) inputTokens += t.input;
      if (typeof t.output === "number" && Number.isFinite(t.output)) outputTokens += t.output;
      if (typeof t.reasoning === "number" && Number.isFinite(t.reasoning)) {
        reasoningTokens += t.reasoning;
      }
      if (typeof t.total === "number" && Number.isFinite(t.total)) totalTokens += t.total;
      const c = t.cache;
      if (c && typeof c === "object") {
        if (typeof c.read === "number" && Number.isFinite(c.read)) cacheRead += c.read;
        if (typeof c.write === "number" && Number.isFinite(c.write)) cacheWrite += c.write;
      }
    }
    if (!providerId && typeof i.providerID === "string") providerId = i.providerID;
    if (!modelId && typeof i.modelID === "string") modelId = i.modelID;
  }

  return {
    sessionId: typeof info.id === "string" ? info.id : null,
    opencodeVersion: typeof info.version === "string" ? info.version : null,
    providerId: providerId ?? null,
    modelId: modelId ?? null,
    assistantTurns,
    inputTokens,
    outputTokens,
    reasoningTokens,
    cacheReadTokens: cacheRead,
    cacheWriteTokens: cacheWrite,
    totalTokens,
    costUsd: Math.round(costUsd * 1e9) / 1e9,
    collectedAt: new Date().toISOString(),
  };
}

function main() {
  const base = ocBaseArgs();
  const list = runOc(base, ["session", "list", "--format", "json", "-n", "1"]);
  if (list.status !== 0) {
    writeFileSync(
      OUT,
      JSON.stringify({ error: "session_list_failed", stderr: (list.stderr || "").slice(0, 2000) }),
    );
    return;
  }

  let sessions;
  try {
    sessions = JSON.parse(list.stdout || "[]");
  } catch {
    writeFileSync(OUT, JSON.stringify({ error: "session_list_parse" }));
    return;
  }

  if (!Array.isArray(sessions) || sessions.length === 0) {
    writeFileSync(OUT, JSON.stringify({ error: "no_session" }));
    return;
  }

  const sid = sessions[0].id;
  if (typeof sid !== "string" || !sid) {
    writeFileSync(OUT, JSON.stringify({ error: "no_session_id" }));
    return;
  }

  const ex = runOc(base, ["export", sid]);
  if (ex.status !== 0) {
    writeFileSync(
      OUT,
      JSON.stringify({ error: "export_failed", stderr: (ex.stderr || "").slice(0, 2000) }),
    );
    return;
  }

  let data;
  try {
    data = JSON.parse(ex.stdout || "{}");
  } catch {
    writeFileSync(OUT, JSON.stringify({ error: "export_parse" }));
    return;
  }

  const aggregated = aggregateExport(data);
  writeFileSync(OUT, JSON.stringify(aggregated));
}

main();
