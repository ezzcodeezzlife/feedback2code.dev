-- CreateEnum
CREATE TYPE "WidgetFeedbackStatus" AS ENUM ('CODING', 'WAITING_FOR_REVIEW', 'MERGED');

-- AlterTable
ALTER TABLE "WidgetFeedback" ADD COLUMN "status" "WidgetFeedbackStatus" NOT NULL DEFAULT 'CODING';
