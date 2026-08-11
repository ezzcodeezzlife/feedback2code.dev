import type { Metadata } from "next";
import { authOptions } from "@/auth";
import RouteAutoRefresh from "@/components/live/route-auto-refresh";
import { PageShell } from "@/components/layout/page-shell";
import RepoFeedbacksPanel from "@/components/repo/repo-feedbacks-panel";
import {
  DASHBOARD_HOME,
  dashboardRepoConfigurePath,
} from "@/lib/app-paths";
import { prisma } from "@/lib/prisma";
import { SITE_NAME } from "@/lib/site-config";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";

type PageProps = {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { owner, repo } = await params;
  const label = owner && repo ? `${owner}/${repo}` : "Repository";
  return {
    title: `${label} feedbacks`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${label} feedbacks | ${SITE_NAME}`,
    },
  };
}

export default async function RepositoryFeedbacksPage({ params }: PageProps) {
  const { owner, repo } = await params;

  if (!owner || !repo) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/");
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    redirect("/");
  }

  const fullName = `${owner}/${repo}`;
  const [canonicalOwner, canonicalRepo] = fullName.split("/");
  const displayOwner = canonicalOwner ?? owner;
  const displayRepo = canonicalRepo ?? repo;

  const config = await prisma.repositoryConfig.findUnique({
    where: {
      userId_fullName: {
        userId,
        fullName,
      },
    },
    select: { id: true, authorizedDomains: true },
  });

  const authorizedDomainList =
    config &&
    Array.isArray(config.authorizedDomains) &&
    (config.authorizedDomains as unknown[]).every(
      (entry: unknown) => typeof entry === "string",
    )
      ? (config.authorizedDomains as string[]).filter(Boolean)
      : [];
  const hasAuthorizedDomains = authorizedDomainList.length > 0;

  const rows =
    config != null
      ? await prisma.widgetFeedback.findMany({
          where: { repositoryConfigId: config.id },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            id: true,
            body: true,
            status: true,
            createdAt: true,
            prUrl: true,
            pagePath: true,
            pageUrl: true,
          },
        })
      : [];

  const feedbacks = rows.map((f) => ({
    id: f.id,
    body: f.body,
    status: f.status,
    createdAtIso: f.createdAt.toISOString(),
    prUrl: f.prUrl,
    pagePath: f.pagePath,
    pageUrl: f.pageUrl,
  }));

  const configurePath = dashboardRepoConfigurePath(displayOwner, displayRepo);

  return (
    <PageShell>
      <RouteAutoRefresh />
      <div className="mb-8">
        <Link
          href={DASHBOARD_HOME}
          className="mb-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-accent">
            [ Feedbacks ]
          </p>
        </div>
        <div className="mt-1 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="min-w-0 text-2xl font-bold tracking-tight">
            <span className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="min-w-0 break-all text-muted-foreground sm:break-normal sm:truncate">
                {displayOwner}
              </span>
              <span className="hidden shrink-0 text-muted-foreground sm:inline">
                /
              </span>
              <span className="min-w-0 break-all sm:hidden">/{displayRepo}</span>
              <span className="hidden min-w-0 sm:inline sm:break-normal sm:truncate">
                {displayRepo}
              </span>
            </span>
          </h1>
          <div className="flex w-full shrink-0 justify-end items-center gap-2 sm:w-auto sm:justify-start">
            <Link
              href={configurePath}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Configure
            </Link>
          </div>
        </div>
      </div>

      <RepoFeedbacksPanel
        feedbacks={feedbacks}
        emptyStateConfigureHref={
          hasAuthorizedDomains ? undefined : configurePath
        }
      />
    </PageShell>
  );
}
