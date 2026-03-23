import type { Metadata } from "next";
import type { WidgetFeedbackStatus } from "@prisma/client";
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
    },
  });

  if (!user) {
    redirect("/");
  }

  const hasGithubInstallation = true;
  let repositoriesError: string | undefined;

  const repoConfigStats = await prisma.repositoryConfig.findMany({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            fullName: true,
            authorizedDomains: true,
            _count: { select: { widgetFeedbacks: true } },
            widgetFeedbacks: {
              take: 12,
              orderBy: { createdAt: "desc" },
              select: {
                status: true,
                createdAt: true,
                body: true,
                pagePath: true,
                pageUrl: true,
                prUrl: true,
              },
            },
          },
        });

  const configIds = repoConfigStats.map((c) => c.id);
  const statusRows =
    configIds.length > 0
      ? await prisma.widgetFeedback.groupBy({
          by: ["repositoryConfigId", "status"],
          where: { repositoryConfigId: { in: configIds } },
          _count: { _all: true },
        })
      : [];

  const statusByConfigId = new Map<
    string,
    Partial<Record<WidgetFeedbackStatus, number>>
  >();
  for (const row of statusRows) {
    const cur = statusByConfigId.get(row.repositoryConfigId) ?? {};
    cur[row.status] = row._count._all;
    statusByConfigId.set(row.repositoryConfigId, cur);
  }

  const emptyStatus = (): Record<WidgetFeedbackStatus, number> => ({
    CODING: 0,
    WAITING_FOR_REVIEW: 0,
    MERGED: 0,
    FAILED: 0,
  });

  const repoConfigStatsByFullName = new Map(
    repoConfigStats.map((cfg) => [cfg.fullName, cfg]),
  );

  const repos = repoConfigStats.map((cfg, i) => ({
    id: i,
    name: cfg.fullName.split('/')[1] || cfg.fullName,
    full_name: cfg.fullName,
    html_url: `https://github.com/${cfg.fullName}`,
    private: false,
  }));

  const enrichedRepos = repos.map((repo) => {
    const cfg = repoConfigStatsByFullName.get(repo.full_name);
    const feedbackRows = cfg?.widgetFeedbacks ?? [];
    const latest = feedbackRows[0];
    const recentSubmissions = feedbackRows.slice(1).map((f) => ({
      status: f.status,
      createdAtIso: f.createdAt.toISOString(),
      body: f.body,
    }));
    const domains = cfg?.authorizedDomains;
    const hasAuthorizedDomains =
      Array.isArray(domains) &&
      (domains as unknown[]).some((d) => typeof d === "string" && d.length > 0);
    const domainCount =
      Array.isArray(domains) && (domains as unknown[]).every((d) => typeof d === "string")
        ? (domains as string[]).filter((d) => d.trim().length > 0).length
        : 0;

    const partial = cfg?.id ? statusByConfigId.get(cfg.id) : undefined;
    const byStatus = emptyStatus();
    if (partial) {
      (Object.entries(partial) as [WidgetFeedbackStatus, number][]).forEach(
        ([s, n]) => {
          if (typeof n === "number") byStatus[s] = n;
        },
      );
    }

    return {
      ...repo,
      feedbackCount: cfg?._count?.widgetFeedbacks ?? 0,
      hasAuthorizedDomains,
      domainCount,
      feedbackByStatus: byStatus,
      latestFeedback: latest
        ? {
            status: latest.status,
            createdAtIso: latest.createdAt.toISOString(),
            body: latest.body,
            pagePath: latest.pagePath,
            pageUrl: latest.pageUrl,
            prUrl: latest.prUrl,
          }
        : null,
      recentSubmissions,
    };
  });

  const manageAccessUrl = null;

  return (
    <DashboardView
      repositories={enrichedRepos}
      hasGithubInstallation={hasGithubInstallation}
      manageAccessUrl={manageAccessUrl}
      repositoriesError={repositoriesError}
    />
  );
}
