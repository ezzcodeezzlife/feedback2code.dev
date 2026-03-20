import { authOptions } from "@/auth";
import { PageShell } from "@/components/layout/page-shell";
import AuthorizedDomainsFields from "@/components/repo/authorized-domains-fields";
import EmbedSnippetCopy from "@/components/repo/embed-snippet-copy";
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

    const receivePrCreatedEmail = formData.get("receivePrCreatedEmail") === "on";

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
        receivePrCreatedEmail,
        customInstructions: customInstructionsFinal,
      },
      update: {
        authorizedDomains,
        receivePrCreatedEmail,
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
      `/${owner}/${repo}?saved=${encodeURIComponent(saved)}&toast=${toastNonce}`,
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

  const embedScriptPreview =
    existing?.widgetId != null
      ? `<script src="${baseUrl}/widget/${existing.widgetId}" async></script>`
      : `<script src="${baseUrl}/widget/YOUR_WIDGET_ID" async></script>`;

  return (
    <PageShell>
      {/* Breadcrumb + header */}
      <div className="mb-8">
        <Link
          href="/"
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
        <h1 className="text-2xl font-bold tracking-tight mt-1">
          {fullName}
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
              <p className="text-sm text-muted-foreground">
                One-line embed. Paste this snippet into the HTML of your site where
                you want the feedback widget to appear — typically right before
                <code className="mx-1 px-1 py-0.5 rounded border border-border-bright bg-background/60">
                  {"</body>"}
                </code>
              </p>
              <EmbedSnippetCopy code={embedScript} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="border border-dashed border-border-bright bg-background/40 p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium text-foreground">One-line embed</span>
                  . Paste this script into your page HTML to load the widget (textarea
                  + submit button).
                </p>
                <div className="rounded border border-border bg-background/60 px-3 py-2 opacity-70">
                  <code className="block overflow-x-auto text-xs text-muted-foreground whitespace-nowrap">
                    {embedScriptPreview}
                  </code>
                </div>
                <p className="mt-2 text-xs text-muted text-left">
                  {embedScript
                    ? "Add at least one authorized domain to create the embed widget JavaScript."
                    : "Save your configuration first to generate the embed snippet."}
                </p>
              </div>
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
                  href={`/${owner}/${repo}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Refresh
                </Link>
              </div>

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
                      className="border border-border bg-background p-4 group hover:border-border-bright transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <time dateTime={f.createdAt.toISOString()}>
                            {formatRelativeTime(f.createdAt)}
                          </time>
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
                            className="text-[11px] uppercase tracking-wider border border-border px-2 py-0.5 text-muted-foreground"
                            title={
                              f.e2bSandboxId
                                ? `E2B sandbox: ${f.e2bSandboxId}`
                                : undefined
                            }
                          >
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

                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
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

              <div className="flex items-start gap-3">
                <EmailNotificationToggle
                  defaultChecked={existing?.receivePrCreatedEmail ?? true}
                />
                <div>
                  <span className="text-sm text-foreground">
                    Email me when feedback creates a PR
                  </span>
                  {user.email && (
                    <span className="ml-2 text-xs text-muted">({user.email})</span>
                  )}
                  <p className="text-xs text-muted mt-1">
                    Get notified once a PR is opened from submitted feedback.
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
              <Textarea
                id="customInstructions"
                name="customInstructions"
                rows={4}
                defaultValue={existing?.customInstructions ?? ""}
                placeholder='e.g., "Always use TailwindCSS for styling!" — Leave empty for default behavior.'
              />
              <p className="text-xs text-muted mt-2">
                Included in the agent prompt for every feedback submission.
              </p>

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
