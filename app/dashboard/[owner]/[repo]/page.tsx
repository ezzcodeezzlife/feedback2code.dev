import { authOptions } from "@/auth";
import { PageShell } from "@/components/layout/page-shell";
import AuthorizedDomainsFields from "@/components/repo/authorized-domains-fields";
import EmbedSnippetCopy from "@/components/repo/embed-snippet-copy";
import { DASHBOARD_HOME, dashboardRepoPath } from "@/lib/app-paths";
import { createWidgetId } from "@/lib/widget-embed";
import { feedbackStatusLabel } from "@/lib/widget-feedback-status";
import { isLocalDevPageUrl } from "@/lib/widget-origin";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Button, { buttonVariants } from "@/components/ui/button";
import Textarea from "@/components/ui/textarea";
import { SaveToast } from "@/components/repo/save-toast";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { EmailNotificationToggle } from "@/components/repo/email-notification-toggle";
import {
  ArrowLeft,
  Globe,
  Mail,
  Code,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  Bot,
  Loader2,
} from "lucide-react";

type PageProps = {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
};

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function feedbackStatusTheme(status: string): { item: string; badge: string } {
  switch (status) {
    case "FAILED":
      return {
        item: "border-red-900/50 bg-red-950/15",
        badge: "border-red-900/50 bg-red-950/30 text-red-400",
      };
    case "MERGED":
      return {
        item: "border-accent/40 bg-accent/10",
        badge: "border-accent/40 bg-accent/10 text-accent",
      };
    case "WAITING_FOR_REVIEW":
      return {
        item: "border-border-bright bg-background",
        badge: "border-border-bright bg-transparent text-foreground",
      };
    case "CODING":
    default:
      return {
        item: "border-border bg-background",
        badge: "border-border bg-transparent text-muted-foreground",
      };
  }
}

export default async function RepositorySettingsPage({ params }: PageProps) {
  const { owner, repo } = await params;

  if (!owner || !repo) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });
  if (!user) {
    redirect("/");
  }

  const fullName = `${owner}/${repo}`;
  type ExistingRepositoryConfigSelected = {
    id: string;
    authorizedDomains: unknown;
    widgetId: string;
    receivePrCreatedEmail: boolean;
    customInstructions: string | null;
  } | null;

  const existing = (await prisma.repositoryConfig.findUnique({
    where: {
      userId_fullName: {
        userId: user.id,
        fullName,
      },
    },
    select: {
      id: true,
      authorizedDomains: true,
      widgetId: true,
      receivePrCreatedEmail: true,
      customInstructions: true,
    },
  })) as ExistingRepositoryConfigSelected;

  const feedbacks =
    existing != null
      ? await prisma.widgetFeedback.findMany({
          where: { repositoryConfigId: existing.id },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            body: true,
            pageUrl: true,
            pagePath: true,
            createdAt: true,
            status: true,
            prUrl: true,
            agentError: true,
            e2bSandboxId: true,
          },
        })
      : [];

  const domains =
    Array.isArray(existing?.authorizedDomains) &&
    (existing.authorizedDomains as unknown[]).every(
      (entry: unknown) => typeof entry === "string",
    )
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

    // Unchecked checkboxes omit the field; the email block is hidden until domains exist,
    // so the first "Save Domains" submit must not turn PR email off.
    const prEmailFlags = formData.getAll("receivePrCreatedEmail");
    const receivePrCreatedEmailFromForm =
      prEmailFlags.length === 0 ? null : prEmailFlags.includes("on");

    const customInstructionsRaw = formData.get("customInstructions");
    const customInstructions =
      typeof customInstructionsRaw === "string"
        ? customInstructionsRaw.trimEnd()
        : "";
    const customInstructionsFinal =
      customInstructions.length > 0 ? customInstructions : null;

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
        receivePrCreatedEmail: receivePrCreatedEmailFromForm ?? true,
        customInstructions: customInstructionsFinal,
      },
      update: {
        authorizedDomains,
        ...(receivePrCreatedEmailFromForm !== null
          ? { receivePrCreatedEmail: receivePrCreatedEmailFromForm }
          : {}),
        customInstructions: customInstructionsFinal,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const saveSection = formData.get("saveSection");
    const saved =
      typeof saveSection === "string" && saveSection.length > 0
        ? saveSection
        : "settings";
    const toastNonce = Date.now().toString();
    redirect(
      `${dashboardRepoPath(owner, repo)}?saved=${encodeURIComponent(saved)}&toast=${toastNonce}`,
    );
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

  const hasAuthorizedDomains = domains.length > 0;

  const embedScript =
    existing?.widgetId != null
      ? `<script src="${baseUrl}/widget/${existing.widgetId}" async></script>`
      : null;

  const repoSettingsPath = dashboardRepoPath(owner, repo);

  return (
    <PageShell>
      {/* Breadcrumb + header */}
      <div className="mb-8">
        <Link
          href={DASHBOARD_HOME}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-accent">
            [ Configure ]
          </p>
        </div>
        <h1 className="mt-1 min-w-0 text-2xl font-bold tracking-tight">
          <span className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="min-w-0 break-all text-muted-foreground sm:break-normal sm:truncate">
              {owner}
            </span>
            <span className="hidden shrink-0 text-muted-foreground sm:inline">/</span>
            <span className="min-w-0 break-all sm:hidden">
              /{repo}
            </span>
            <span className="hidden min-w-0 sm:inline sm:break-normal sm:truncate">
              {repo}
            </span>
          </span>
        </h1>
      </div>

      <form action={saveAuthorizedDomains} className="space-y-0">
        {/* Section: Authorized Domains */}
        <section className="border border-border bg-surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Authorized Domains
            </h2>
          </div>

          <AuthorizedDomainsFields initialDomains={domains} />

          <div className="mt-4">
            <Button
              type="submit"
              size="default"
              name="saveSection"
              value="domains"
              className="bg-white text-black hover:bg-white border border-white"
            >
              Save Domains
            </Button>
          </div>
        </section>

        {/* Section: Embed Widget */}
        <section className="border border-border border-t-0 bg-surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Embed Widget</h2>
          </div>

          {embedScript && hasAuthorizedDomains ? (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                One-line embed. Paste this snippet into the HTML of your site where
                you want the feedback widget to appear — typically right before{" "}
                <code className="mx-1 px-1 py-0.5 rounded border border-border-bright bg-background/60">
                  &lt;/body&gt;
                </code>
                .
              </p>
              <EmbedSnippetCopy code={embedScript} />
            </div>
          ) : (
            <div className="border border-dashed border-border-bright p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {!existing
                  ? "Save your configuration first to generate the embed snippet."
                  : "Add at least one authorized domain to create the embed widget JavaScript."}
              </p>
            </div>
          )}
        </section>

        {hasAuthorizedDomains ? (
          <>
            {/* Section: Submitted Feedback */}
            <section className="border border-border border-t-0 bg-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    Submitted Feedback
                  </h2>
                  {feedbacks.length > 0 && (
                    <span className="text-xs text-accent border border-accent px-1.5 py-0.5 ml-1">
                      {feedbacks.length}
                    </span>
                  )}
                </div>
                <Link
                  href={repoSettingsPath}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Refresh
                </Link>
              </div>

              {existing && (
                <p className="text-xs text-muted my-4">
                  Latest visitor feedback submissions for this project.
                </p>
              )}

              {!existing ? (
                <div className="border border-dashed border-border-bright p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Save this repository once to start collecting feedback.
                  </p>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="border border-dashed border-border-bright p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No submissions yet. Entries appear here once visitors post from
                    the widget.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {feedbacks.map((f) => (
                    <div
                      key={f.id}
                      className={`${feedbackStatusTheme(f.status).item} p-4 group hover:border-border-bright transition-colors border`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <time dateTime={f.createdAt.toISOString()}>
                            {formatRelativeTime(f.createdAt)}
                          </time>
                          {f.pagePath && (
                            <span
                              className="font-mono text-[11px] text-muted-foreground border border-border px-1.5 py-0.5 max-w-[200px] truncate"
                              title={f.pagePath}
                            >
                              {f.pagePath}
                            </span>
                          )}
                          {f.pageUrl && !isLocalDevPageUrl(f.pageUrl) && (
                            <a
                              href={f.pageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 max-w-[250px] truncate text-muted-foreground hover:text-accent transition-colors"
                            >
                              {f.pageUrl}
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider px-2 py-0.5 border ${feedbackStatusTheme(f.status).badge}`}
                            title={
                              f.e2bSandboxId
                                ? `E2B sandbox: ${f.e2bSandboxId}`
                                : undefined
                            }
                          >
                            {f.status === "CODING" && (
                              <Loader2
                                className="h-3 w-3 shrink-0 animate-spin text-accent"
                                aria-hidden
                              />
                            )}
                            {feedbackStatusLabel(f.status)}
                          </span>
                          {f.prUrl && (
                            <a
                              href={f.prUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] uppercase tracking-wider bg-accent text-black px-2 py-0.5 font-medium hover:bg-accent-hover transition-colors"
                            >
                              View PR
                            </a>
                          )}
                        </div>
                      </div>

                      {f.agentError && (
                        <div className="flex items-start gap-2 mb-2 border border-red-900/40 bg-red-950/30 p-2">
                          <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                          <pre className="text-[11px] leading-snug text-red-400 overflow-auto max-h-32">
                            {f.agentError}
                          </pre>
                        </div>
                      )}

                      <p
                        className="line-clamp-4 wrap-break-word text-sm leading-relaxed text-foreground"
                        title={f.body}
                      >
                        {f.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section: Email Notifications */}
            <section className="border border-border border-t-0 bg-surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Email Notifications
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <EmailNotificationToggle
                  defaultChecked={existing?.receivePrCreatedEmail ?? true}
                />
                <div>
                  <p className="text-xs text-muted">
                    Email me when feedback creates a PR
                    {user.email ? ` (${user.email})` : ""}.
                  </p>
                </div>
              </div>

              <button
                id="saveEmailSubmit"
                type="submit"
                name="saveSection"
                value="email"
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
            </section>

            {/* Section: Agent Instructions */}
            <section className="border border-border border-t-0 bg-surface p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Custom Agent Instructions
                </h2>
              </div>

              <label htmlFor="customInstructions" className="sr-only">
                Agent instructions (optional)
              </label>
              <p className="text-xs text-muted my-4">
                Included in the agent prompt for every feedback submission.
              </p>
              <Textarea
                id="customInstructions"
                name="customInstructions"
                rows={4}
                defaultValue={existing?.customInstructions ?? ""}
                placeholder='e.g., "Always use TailwindCSS for styling." — Leave empty for default behavior.'
              />


              <div className="mt-4">
                <Button
                  type="submit"
                  size="default"
                  name="saveSection"
                  value="instructions"
                  className="bg-white text-black hover:bg-white border border-white"
                >
                  Save Instructions
                </Button>
              </div>
            </section>
          </>
        ) : (
          <section className="border border-border border-t-0 bg-surface p-6">
            <div className="flex items-start gap-3 rounded border border-accent/30 bg-accent/5 p-3">
              <AlertCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <p className="text-sm text-accent-foreground">
                Add at least one authorized domain to unlock feedback, email
                notifications, and agent instructions.
              </p>
            </div>
          </section>
        )}
      </form>

      <SonnerToaster />
      <SaveToast />
    </PageShell>
  );
}
