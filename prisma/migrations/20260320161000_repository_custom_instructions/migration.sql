-- Add repository-level custom instructions for the coding agent.
ALTER TABLE "RepositoryConfig"
ADD COLUMN "customInstructions" TEXT;

