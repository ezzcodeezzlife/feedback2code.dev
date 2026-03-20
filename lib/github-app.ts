import { createPrivateKey } from "node:crypto";
import { SignJWT, importPKCS8 } from "jose";

type InstalledRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  pushed_at?: string;
};

function getPrivateKey() {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!raw) return null;

  // Keep .env-friendly format support (\n escaped).
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

async function createAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = getPrivateKey();

  if (!appId || !privateKey) {
    throw new Error("Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY.");
  }

  // GitHub can provide app keys as PKCS#1 ("BEGIN RSA PRIVATE KEY").
  // jose expects PKCS#8, so normalize to PKCS#8 first.
  const pkcs8Pem = createPrivateKey(privateKey).export({
    format: "pem",
    type: "pkcs8",
  });
  const key = await importPKCS8(pkcs8Pem.toString(), "RS256");
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 9 * 60)
    .setIssuer(appId)
    .sign(key);
}

/** Short-lived token for this installation (clone, push, REST API including PRs). */
export async function getInstallationAccessToken(
  installationId: string,
): Promise<string> {
  const appJwt = await createAppJwt();
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${appJwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(
      errorBody?.message ??
        `Failed to create installation token (${response.status}).`,
    );
  }

  const data = (await response.json()) as { token: string };
  return data.token;
}

export async function getInstallationRepositories(installationId: string) {
  const token = await getInstallationAccessToken(installationId);

  const response = await fetch(
    "https://api.github.com/installation/repositories?per_page=100",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(
      errorBody?.message ??
        `Failed to load installation repositories (${response.status}).`,
    );
  }

  const data = (await response.json()) as { repositories?: InstalledRepo[] };
  return data.repositories ?? [];
}
