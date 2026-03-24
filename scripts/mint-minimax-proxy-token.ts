/**
 * Mint a short-lived MiniMax proxy token for local OpenCode tests.
 * Uses PrismaClient directly (avoids `lib/prisma` → server-only in scripts).
 *
 *   npx dotenv -e .env.development -- npx tsx scripts/mint-minimax-proxy-token.ts
 *   npx dotenv -e .env.development -- npx tsx scripts/mint-minimax-proxy-token.ts -- --base http://localhost:3000
 *
 * Prints one JSON line: { plainToken, baseURL, feedbackId }
 */
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { createHash, randomBytes } from "node:crypto";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.development") });

function baseFromArgs(): string | undefined {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--base");
  if (i >= 0 && argv[i + 1]) return argv[i + 1].replace(/\/$/, "");
  return undefined;
}

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

function hashMinimaxProxyTokenSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const feedbackId = `local-proxy-${Date.now()}`;
    const plainToken = randomBytes(32).toString("base64url");
    const tokenHash = hashMinimaxProxyTokenSecret(plainToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.$transaction([
      prisma.agentMinimaxProxyToken.updateMany({
        where: { widgetFeedbackId: feedbackId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.agentMinimaxProxyToken.create({
        data: {
          tokenHash,
          widgetFeedbackId: feedbackId,
          e2bSandboxId: null,
          expiresAt,
        },
      }),
    ]);

    const base =
      baseFromArgs() ??
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      process.env.APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";
    const baseURL = `${base}/api/agent/minimax-proxy/anthropic/v1`;
    // eslint-disable-next-line no-console -- CLI output
    console.log(JSON.stringify({ plainToken, baseURL, feedbackId }));
  } finally {
    await prisma.$disconnect();
  }
}

void main();
