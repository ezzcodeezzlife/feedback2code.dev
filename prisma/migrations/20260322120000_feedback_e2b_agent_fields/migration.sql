-- AlterEnum
ALTER TYPE "WidgetFeedbackStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "WidgetFeedback" ADD COLUMN "e2bSandboxId" TEXT;
ALTER TABLE "WidgetFeedback" ADD COLUMN "prUrl" TEXT;
ALTER TABLE "WidgetFeedback" ADD COLUMN "agentError" TEXT;
ALTER TABLE "WidgetFeedback" ADD COLUMN "agentFinishedAt" TIMESTAMP(3);
