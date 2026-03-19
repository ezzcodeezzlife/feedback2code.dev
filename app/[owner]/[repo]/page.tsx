import { authOptions } from "@/auth";
import { PagePanel, PageShell } from "@/components/layout/page-shell";
import AuthorizedDomainsFields from "@/components/repo/authorized-domains-fields";
import EmbedSnippetCopy from "@/components/repo/embed-snippet-copy";
import { createWidgetId } from "@/lib/widget-embed";
import { isLocalDevPageUrl } from "@/lib/widget-origin";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
};

export default async function RepositorySettingsPage({ params }: PageProps) {
  const { owner, repo } = await params;

  if (!owner || !repo) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    redirect("/");
  }

  const fullName = `${owner}/${repo}`;
  const existing = await prisma.repositoryConfig.findUnique({
    where: {
      userId_fullName: {
        userId: user.id,
        fullName,
      },
    },
    select: { id: true, authorizedDomains: true, widgetId: true },
  });

  const feedbacks =
    existing != null
      ? await prisma.widgetFeedback.findMany({
          where: { repositoryConfigId: existing.id },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: { id: true, body: true, pageUrl: true, createdAt: true },
        })
      : [];

  const domains =
    Array.isArray(existing?.authorizedDomains) &&
    existing.authorizedDomains.every((entry) => typeof entry === "string")
      ? (existing.authorizedDomains as string[])
      : [];

  async function saveAuthorizedDomains(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) redirect("/");

    const authorizedDomains = formData
      .getAll("authorizedDomains")
      .map((value) => String(value).trim().toLowerCase())
      .filter(Boolean);

    await prisma.repositoryConfig.upsert({
      where: {
        userId_fullName: {
          userId: user.id,
          fullName,
        },
      },
      create: {
        userId: user.id,
        owner,
        repo,
        fullName,
        widgetId: createWidgetId(),
        authorizedDomains,
      },
      update: {
        authorizedDomains,
      },
    });

    redirect(`/${owner}/${repo}`);
  }

  const headerList = await headers();
  const forwardedProto = headerList.get("x-forwarded-proto");
  const forwardedHost =
    headerList.get("x-forwarded-host") ?? headerList.get("host");
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (forwardedHost
      ? `${forwardedProto ?? "http"}://${forwardedHost}`
      : "http://localhost:3000");

  const embedScript =
    existing?.widgetId != null
      ? `<script src="${baseUrl}/widget/${existing.widgetId}" async></script>`
      : null;

  return (
    <PageShell>
      <PagePanel>
        <div className="mb-6">
          <div className="mb-4">
            <Link
              href="/"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Back to dashboard
            </Link>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Repository</p>
          <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
        </div>

        <form action={saveAuthorizedDomains} className="space-y-4">
          <AuthorizedDomainsFields initialDomains={domains} />

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              Save
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-black/10 pt-8 dark:border-white/15">
          <h2 className="text-lg font-semibold tracking-tight">Embed widget</h2>

          {embedScript ? (
            <EmbedSnippetCopy code={embedScript} />
          ) : (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Save this configuration once to generate your embed snippet and widget
              ID.
            </p>
          )}
        </div>

        <div className="mt-8 border-t border-black/10 pt-8 dark:border-white/15">
          <h2 className="text-lg font-semibold tracking-tight">Submitted feedback</h2>
          {!existing ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Save this repository once to start collecting feedback from embedded
              sites.
            </p>
          ) : feedbacks.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              No submissions yet. After visitors post from the widget, entries appear
              here.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {feedbacks.map((f) => (
                <li
                  key={f.id}
                  className="rounded-lg border border-black/10 bg-zinc-50/80 p-4 dark:border-white/15 dark:bg-zinc-950/80"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <time dateTime={f.createdAt.toISOString()}>
                      {f.createdAt.toLocaleString()}
                    </time>
                    {f.pageUrl && !isLocalDevPageUrl(f.pageUrl) ? (
                      <a
                        href={f.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[min(100%,280px)] truncate font-medium text-zinc-700 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                      >
                        {f.pageUrl}
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
                    {f.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PagePanel>
    </PageShell>
  );
}
