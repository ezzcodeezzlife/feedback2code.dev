/*
  Warnings:

  - The required column `widgetId` was added to the `RepositoryConfig` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RepositoryConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "authorizedDomains" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepositoryConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RepositoryConfig" ("id", "userId", "owner", "repo", "fullName", "widgetId", "authorizedDomains", "createdAt", "updatedAt")
SELECT "id", "userId", "owner", "repo", "fullName", lower(hex(randomblob(16))), "authorizedDomains", "createdAt", "updatedAt" FROM "RepositoryConfig";
DROP TABLE "RepositoryConfig";
ALTER TABLE "new_RepositoryConfig" RENAME TO "RepositoryConfig";
CREATE UNIQUE INDEX "RepositoryConfig_widgetId_key" ON "RepositoryConfig"("widgetId");
CREATE UNIQUE INDEX "RepositoryConfig_userId_fullName_key" ON "RepositoryConfig"("userId", "fullName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
