-- CreateTable
CREATE TABLE "WidgetFeedback" (
    "id" TEXT NOT NULL,
    "repositoryConfigId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WidgetFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WidgetFeedback_repositoryConfigId_createdAt_idx" ON "WidgetFeedback"("repositoryConfigId", "createdAt");

-- AddForeignKey
ALTER TABLE "WidgetFeedback" ADD CONSTRAINT "WidgetFeedback_repositoryConfigId_fkey" FOREIGN KEY ("repositoryConfigId") REFERENCES "RepositoryConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
