import { prisma } from "@/lib/prisma";
import { runE2bFeedbackAgent } from "@/lib/feedback-agent/run-e2b-feedback-agent";

/**
 * Loads feedback + repo + installation from DB and runs the E2B pipeline.
 * Used by the job route and by the inline `after()` fallback.
 */
export async function runFeedbackAgentJob(feedbackId: string): Promise<void> {
  const row = await prisma.widgetFeedback.findUnique({
    where: { id: feedbackId },
    select: {
      id: true,
      body: true,
      status: true,
      repositoryConfig: {
        select: {
          fullName: true,
          owner: true,
          repo: true,
          user: { select: { githubInstallationId: true } },
        },
      },
    },
  });

  if (!row) {
    console.warn("[runFeedbackAgentJob] unknown feedback id", feedbackId);
    return;
  }

  if (row.status !== "CODING") {
    return;
  }

  const dashboardPath = `/${row.repositoryConfig.owner}/${row.repositoryConfig.repo}`;

  await runE2bFeedbackAgent({
    feedbackId: row.id,
    owner: row.repositoryConfig.owner,
    repo: row.repositoryConfig.repo,
    fullName: row.repositoryConfig.fullName,
    feedbackBody: row.body,
    dashboardPath,
    githubInstallationId: row.repositoryConfig.user.githubInstallationId,
  });
}
