import { authOptions } from "@/auth";
import DashboardView from "@/components/home/dashboard-view";
import LandingView from "@/components/home/landing-view";
import type { InstalledRepo } from "@/lib/github-app";
import { getInstallationRepositories } from "@/lib/github-app";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return <LandingView />;
  }

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

  let repos: InstalledRepo[] = [];
  let repositoriesError: string | undefined;
  try {
    repos = await getInstallationRepositories(user.githubInstallationId);
  } catch (error) {
    repositoriesError =
      error instanceof Error ? error.message : "Failed to load repositories.";
  }

  // Enrich the GitHub repo list with your DB data (feedback counts + latest feedback).
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

  const manageAccessUrl = `https://github.com/settings/installations/${user.githubInstallationId}`;

  return (
    <DashboardView
      repositories={enrichedRepos}
      manageAccessUrl={manageAccessUrl}
      repositoriesError={repositoriesError}
    />
  );
}
