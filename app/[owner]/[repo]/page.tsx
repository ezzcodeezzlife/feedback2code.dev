import { authOptions } from "@/auth";
import { PagePanel, PageShell } from "@/components/layout/page-shell";
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
import Checkbox from "@/components/ui/checkbox";
import Textarea from "@/components/ui/textarea";
import { SaveToast } from "@/components/repo/save-toast";
import { SonnerToaster } from "@/components/ui/sonner-toaster";
import { SubmitEmailOnToggle } from "@/components/repo/submit-email-on-toggle";

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
    select: { id: true, email: true },
  });
  if (!user) {
    redirect("/");
  }

  const fullName = `${owner}/${repo}`;
  type ExistingRepositoryConfigSelected = {
    id: string;
    // Stored as Json in Prisma; we validate at runtime before using.
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
    // Add a nonce so the client can suppress React StrictMode double-mount
    // without blocking future saves of the same section.
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
              className={buttonVariants({ variant: "outline", size: "lg" })}
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
            <Button
              type="submit"
              size="lg"
              name="saveSection"
              value="domains"
            >
              Save
            </Button>
          </div>

          <div className="mt-8 border-t border-black/10 pt-8 dark:border-white/15">
            <h2 className="text-lg font-semibold tracking-tight">
              Email me when feedback creates a PR
            </h2>
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-black/10 bg-white/60 p-3 dark:border-white/15 dark:bg-zinc-950/40">
              <Checkbox
                id="receivePrCreatedEmail"
                name="receivePrCreatedEmail"
                type="checkbox"
                value="on"
                defaultChecked={existing?.receivePrCreatedEmail ?? true}
                className="mt-1"
              />
              <div className="space-y-1">
                <label
                  htmlFor="receivePrCreatedEmail"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Email me when feedback creates a PR
                  {user.email ? (
                    <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      ({user.email})
                    </span>
                  ) : null}
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  When enabled, you’ll get a notification once a PR is created
                  from submitted feedback in this repository.
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
            <SubmitEmailOnToggle />
          </div>

          <div className="mt-8 border-t border-black/10 pt-8 dark:border-white/15">
            <h2 className="text-lg font-semibold tracking-tight">
              Agent instructions
            </h2>
            <div className="mt-4 space-y-2 rounded-lg border border-black/10 bg-white/60 p-3 dark:border-white/15 dark:bg-zinc-950/40">
              <label
                htmlFor="customInstructions"
                className="sr-only"
              >
                Agent instructions (optional)
              </label>
              <Textarea
                id="customInstructions"
                name="customInstructions"
                rows={4}
                defaultValue={existing?.customInstructions ?? ""}
                placeholder="e.g., Always add a title called prototype to the index! Leave empty to use default behavior."
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Included in the agent prompt for every submitted feedback in
                this repository.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button
                type="submit"
                size="lg"
                name="saveSection"
                value="instructions"
              >
                Save
              </Button>
            </div>
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
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Submitted feedback
            </h2>
            <Link
              href={`/${owner}/${repo}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Refresh
            </Link>
          </div>
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
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
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
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span
                        className="rounded-full border border-black/15 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-800 dark:border-white/20 dark:bg-zinc-900 dark:text-zinc-200"
                        title={
                          f.e2bSandboxId
                            ? `E2B sandbox: ${f.e2bSandboxId}`
                            : undefined
                        }
                      >
                        {feedbackStatusLabel(f.status)}
                      </span>
                      {f.prUrl ? (
                        <a
                          href={f.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-emerald-700"
                        >
                          View PR
                        </a>
                      ) : null}
                    </div>
                  </div>
                  {f.agentError ? (
                    <pre className="mt-2 max-h-32 overflow-auto rounded-md border border-red-200 bg-red-50 p-2 text-[11px] leading-snug text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
                      {f.agentError}
                    </pre>
                  ) : null}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
                    {f.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PagePanel>
      <SonnerToaster />
      <SaveToast />
    </PageShell>
  );
}
