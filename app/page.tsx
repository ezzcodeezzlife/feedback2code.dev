import { authOptions } from "@/auth";
import DashboardView from "@/components/home/dashboard-view";
import LandingView from "@/components/home/landing-view";
import { getInstallationRepositories } from "@/lib/github-app";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

type InstalledRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  pushed_at?: string;
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <LandingView />;
  }

  const FEEDBACK_QUOTA_LIMIT = 100;
  const FEEDBACK_QUOTA_WINDOW_DAYS = 30;
  const now = new Date();
  const cutoff = new Date(
    now.getTime() - FEEDBACK_QUOTA_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      githubAppInstalled: true,
      githubInstallationId: true,
    },
  });

  if (!user?.githubAppInstalled || !user.githubInstallationId) {
    redirect("/api/github/install");
  }

  // Rolling usage: count submissions in the last 30 days.
  const usedInWindow = await prisma.userFeedbackLimitEvent.count({
    where: {
      userId: user.id,
      createdAt: { gte: cutoff },
    },
  });

  const oldestInWindow = await prisma.userFeedbackLimitEvent.findFirst({
    where: {
      userId: user.id,
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const resetAtIso = oldestInWindow
    ? new Date(
        oldestInWindow.createdAt.getTime() +
          FEEDBACK_QUOTA_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString()
    : null;

  const remaining = Math.max(0, FEEDBACK_QUOTA_LIMIT - usedInWindow);

  let repos: InstalledRepo[] = [];
  let repositoriesError: string | undefined;
  try {
    repos = await getInstallationRepositories(user.githubInstallationId);
  } catch (error) {
    repositoriesError =
      error instanceof Error ? error.message : "Failed to load repositories.";
  }
  const manageAccessUrl = `https://github.com/settings/installations/${user.githubInstallationId}`;

  return (
    <DashboardView
      repositories={repos}
      manageAccessUrl={manageAccessUrl}
      repositoriesError={repositoriesError}
      feedbackQuota={{
        limit: FEEDBACK_QUOTA_LIMIT,
        used: usedInWindow,
        remaining,
        resetAtIso,
      }}
    />
  );
}
