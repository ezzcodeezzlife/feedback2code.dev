-- Add repository-level email preference for PR-created notifications.
ALTER TABLE "RepositoryConfig"
ADD COLUMN "receivePrCreatedEmail" BOOLEAN NOT NULL DEFAULT true;

