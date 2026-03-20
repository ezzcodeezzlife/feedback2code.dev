/**
 * Runs inside the E2B sandbox only. Mints installation tokens from GitHub App credentials
 * (env). No dependency on npm packages beyond Node built-ins.
 */
import { createPrivateKey, createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

function readPrivateKeyPem() {
  const file = process.env.GITHUB_APP_PRIVATE_KEY_FILE;
  if (file) {
    return readFileSync(file, "utf8");
  }
  const raw = process.env.GITHUB_APP_PRIVATE_KEY ?? "";
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

async function mintInstallationToken() {
  const appId = process.env.GITHUB_APP_ID;
  const iid = process.env.GITHUB_INSTALLATION_ID;
  if (!appId || !iid) {
    throw new Error("Missing GITHUB_APP_ID or GITHUB_INSTALLATION_ID");
  }
  const keyPem = readPrivateKeyPem();
  if (!keyPem.trim()) {
    throw new Error("Missing GitHub App private key (file or env)");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: String(appId) }),
  ).toString("base64url");
  const data = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(data);
  sign.end();
  const key = createPrivateKey(keyPem);
  const sig = sign.sign(key);
  const jwt = `${data}.${Buffer.from(sig).toString("base64url")}`;

  const res = await fetch(
    `https://api.github.com/app/installations/${iid}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  const j = await res.json();
  if (!res.ok) {
    throw new Error(j.message ?? `HTTP ${res.status}`);
  }
  if (typeof j.token !== "string") {
    throw new Error("No token in GitHub response");
  }
  return j.token;
}

async function cmdToken() {
  const t = await mintInstallationToken();
  process.stdout.write(t);
}

async function cmdDefaultBranch() {
  const token = await mintInstallationToken();
  const owner = process.env.F2C_OWNER;
  const repo = process.env.F2C_REPO;
  if (!owner || !repo) {
    throw new Error("Missing F2C_OWNER or F2C_REPO");
  }
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const j = await res.json();
  if (!res.ok) {
    throw new Error(j.message ?? `HTTP ${res.status}`);
  }
  process.stdout.write(
    typeof j.default_branch === "string" ? j.default_branch : "main",
  );
}

async function cmdCreatePr() {
  const token = await mintInstallationToken();
  const owner = process.env.F2C_OWNER;
  const repo = process.env.F2C_REPO;
  const head = process.env.F2C_PR_HEAD;
  const base = process.env.F2C_PR_BASE;
  const titlePath = process.argv[3];
  const bodyPath = process.argv[4];
  if (!owner || !repo || !head || !base || !titlePath || !bodyPath) {
    throw new Error("Missing F2C_* env or title/body paths");
  }
  const title = (await readFile(titlePath, "utf8")).trimEnd();
  const body = (await readFile(bodyPath, "utf8")).trimEnd();
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
  const payload = JSON.stringify({ title, body, head, base });

  let lastErr = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 2000));
    }
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: payload,
    });
    const j = await res.json();
    if (res.ok && typeof j.html_url === "string") {
      process.stdout.write(j.html_url);
      return;
    }
    const bodyStr = JSON.stringify(j).slice(0, 600);
    lastErr = typeof j.message === "string" ? j.message : bodyStr;
    const transient422 =
      res.status === 422 &&
      /No commits between|could not be found|does not exist|invalid head|head ref/i.test(
        `${lastErr} ${bodyStr}`,
      );
    if (!transient422) {
      throw new Error(lastErr);
    }
  }
  throw new Error(lastErr || "create-pr failed after retries");
}

const cmd = process.argv[2];
const run = {
  token: cmdToken,
  "default-branch": cmdDefaultBranch,
  "create-pr": cmdCreatePr,
}[cmd];

if (!run) {
  console.error("Usage: e2b-github.mjs token|default-branch|create-pr ...");
  process.exit(1);
}

run().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
