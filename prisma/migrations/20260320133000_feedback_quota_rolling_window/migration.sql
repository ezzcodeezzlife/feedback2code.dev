-- CreateTable
CREATE TABLE "UserFeedbackLimitEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgetFeedbackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFeedbackLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFeedbackLimitEvent_userId_createdAt_idx" ON "UserFeedbackLimitEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserFeedbackLimitEvent_widgetFeedbackId_key" ON "UserFeedbackLimitEvent"("widgetFeedbackId");

-- AddForeignKey
ALTER TABLE "UserFeedbackLimitEvent" ADD CONSTRAINT "UserFeedbackLimitEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeedbackLimitEvent" ADD CONSTRAINT "UserFeedbackLimitEvent_widgetFeedbackId_fkey" FOREIGN KEY ("widgetFeedbackId") REFERENCES "WidgetFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

