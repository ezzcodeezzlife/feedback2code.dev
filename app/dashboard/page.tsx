import type { Metadata } from "next";
import { authOptions } from "@/auth";
import DashboardView from "@/components/home/dashboard-view";
import type { InstalledRepo } from "@/lib/github-app";
import { getInstallationRepositories } from "@/lib/github-app";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, SITE_PAGE_TITLE } from "@/lib/site-config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: `Dashboard — ${SITE_PAGE_TITLE}`,
  robots: { index: false, follow: false },
  openGraph: { title: `Dashboard — ${SITE_NAME}`, url: "/dashboard" },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      githubAppInstalled: true,
      githubInstallationId: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  const hasGithubInstallation = Boolean(
    user.githubAppInstalled && user.githubInstallationId,
  );

  let repos: InstalledRepo[] = [];
  let repositoriesError: string | undefined;
  if (hasGithubInstallation && user.githubInstallationId) {
    try {
      repos = await getInstallationRepositories(user.githubInstallationId);
    } catch (error) {
      repositoriesError =
        error instanceof Error ? error.message : "Failed to load repositories.";
    }
  }

  const fullNames = repos.map((r) => r.full_name);

  const repoConfigStats =
    fullNames.length > 0
      ? await prisma.repositoryConfig.findMany({
          where: {
            userId: user.id,
            fullName: { in: fullNames },
          },
          select: {
            fullName: true,
            _count: { select: { widgetFeedbacks: true } },
            widgetFeedbacks: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                status: true,
                createdAt: true,
                body: true,
              },
            },
          },
        })
      : [];

  const repoConfigStatsByFullName = new Map(
    repoConfigStats.map((cfg) => [cfg.fullName, cfg]),
  );

  const enrichedRepos = repos.map((repo) => {
    const cfg = repoConfigStatsByFullName.get(repo.full_name);
    const latest = cfg?.widgetFeedbacks?.[0];

    return {
      ...repo,
      feedbackCount: cfg?._count?.widgetFeedbacks ?? 0,
      latestFeedback: latest
        ? {
            status: latest.status,
            createdAtIso: latest.createdAt.toISOString(),
            body: latest.body,
          }
        : null,
    };
  });

  const manageAccessUrl =
    user.githubInstallationId != null
      ? `https://github.com/settings/installations/${user.githubInstallationId}`
      : null;

  return (
    <DashboardView
      repositories={enrichedRepos}
      hasGithubInstallation={hasGithubInstallation}
      manageAccessUrl={manageAccessUrl}
      repositoriesError={repositoriesError}
    />
  );
}
