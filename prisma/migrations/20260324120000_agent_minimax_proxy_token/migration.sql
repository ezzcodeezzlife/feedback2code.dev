-- CreateTable
CREATE TABLE "AgentMinimaxProxyToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "widgetFeedbackId" TEXT NOT NULL,
    "e2bSandboxId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMinimaxProxyToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentMinimaxProxyToken_tokenHash_key" ON "AgentMinimaxProxyToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AgentMinimaxProxyToken_widgetFeedbackId_idx" ON "AgentMinimaxProxyToken"("widgetFeedbackId");

-- CreateIndex
CREATE INDEX "AgentMinimaxProxyToken_expiresAt_idx" ON "AgentMinimaxProxyToken"("expiresAt");
