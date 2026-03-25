import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "node:crypto";

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2h (sandbox max 1h + slack)

export function hashMinimaxProxyTokenSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

/**
 * Revokes any active proxy tokens for this feedback, then creates a new one.
 * Returns the raw secret once (written into the sandbox OpenCode config only).
 */
export async function mintMinimaxProxyTokenForFeedback(input: {
  widgetFeedbackId: string;
  e2bSandboxId: string | null;
}): Promise<{ plainToken: string }> {
  const plainToken = randomBytes(32).toString("base64url");
  const tokenHash = hashMinimaxProxyTokenSecret(plainToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.agentMinimaxProxyToken.updateMany({
      where: { widgetFeedbackId: input.widgetFeedbackId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.agentMinimaxProxyToken.create({
      data: {
        tokenHash,
        widgetFeedbackId: input.widgetFeedbackId,
        e2bSandboxId: input.e2bSandboxId,
        expiresAt,
      },
    }),
  ]);

  return { plainToken };
}

export async function revokeMinimaxProxyTokensForFeedback(
  widgetFeedbackId: string,
): Promise<void> {
  await prisma.agentMinimaxProxyToken.updateMany({
    where: { widgetFeedbackId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function validateMinimaxProxyToken(
  plainToken: string,
): Promise<
  | { ok: true; widgetFeedbackId: string; e2bSandboxId: string | null }
  | { ok: false }
> {
  const tokenHash = hashMinimaxProxyTokenSecret(plainToken);
  const row = await prisma.agentMinimaxProxyToken.findUnique({
    where: { tokenHash },
    select: {
      widgetFeedbackId: true,
      e2bSandboxId: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
  if (!row) return { ok: false };
  if (row.revokedAt) return { ok: false };
  if (row.expiresAt.getTime() <= Date.now()) return { ok: false };
  return { ok: true, widgetFeedbackId: row.widgetFeedbackId, e2bSandboxId: row.e2bSandboxId };
}
