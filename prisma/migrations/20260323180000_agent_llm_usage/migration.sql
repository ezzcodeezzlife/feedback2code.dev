-- AlterTable
ALTER TABLE "WidgetFeedback" ADD COLUMN     "agentLlmCostUsd" DECIMAL(14,6),
ADD COLUMN     "agentLlmInputTokens" INTEGER,
ADD COLUMN     "agentLlmOutputTokens" INTEGER,
ADD COLUMN     "agentLlmTotalTokens" INTEGER,
ADD COLUMN     "agentLlmMeta" JSONB;
