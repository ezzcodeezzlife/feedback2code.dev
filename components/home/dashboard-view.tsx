"use client";

import { PageShell } from "@/components/layout/page-shell";
import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { dashboardRepoPath, dashboardRepoConfigurePath } from "@/lib/app-paths";
import type { InstalledRepo } from "@/lib/github-app";
import { feedbackStatusLabel, type WidgetFeedbackStatus } from "@/lib/widget-feedback-status";
import { isLocalDevPageUrl } from "@/lib/widget-origin";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  GitBranch,
  Github,
  Search,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const seconds = Math.floor((now - then) / 1000);
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

function feedbackBodySnippet(body: string, max = 200): string {
  const n = body.replace(/\s+/g, " ").trim();
  return n.length <= max ? n : `${n.slice(0, max - 1)}…`;
}

function pageUrlLabel(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
}

function StatusBadge({
  status,
  compact,
}: {
  status: WidgetFeedbackStatus;
  compact?: boolean;
}) {
  return (
    <span
      className={[
        compact
          ? "inline-flex items-center gap-0.5 border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide leading-tight w-fit shrink-0"
          : "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] uppercase tracking-wider border w-fit shrink-0",
        status === "FAILED"
          ? "border-red-900/50 bg-red-950/30 text-red-400"
          : status === "MERGED"
            ? "border-accent/40 bg-accent/10 text-accent"
            : status === "WAITING_FOR_REVIEW"
              ? "border-border-bright text-foreground"
              : "border-border text-muted-foreground",
      ].join(" ")}
    >
      {status === "CODING" && (
        <Loader2
          className={[
            "shrink-0 animate-spin text-accent",
            compact ? "h-2.5 w-2.5" : "h-3 w-3",
          ].join(" ")}
          aria-hidden
        />
      )}
      {feedbackStatusLabel(status)}
    </span>
  );
}

type FeedbackByStatus = Record<WidgetFeedbackStatus, number>;

type SubmissionListItem = {
  status: WidgetFeedbackStatus;
  createdAtIso: string;
  body: string;
};

type RepoEntry = InstalledRepo & {
  feedbackCount: number;
  hasAuthorizedDomains: boolean;
  domainCount: number;
  feedbackByStatus: FeedbackByStatus;
  latestFeedback: {
    status: WidgetFeedbackStatus;
    createdAtIso: string;
    body: string;
    pagePath: string | null;
    pageUrl: string | null;
    prUrl: string | null;
  } | null;
  recentSubmissions: SubmissionListItem[];
};

/** Metric tiles from DB: pipeline + widget setup (no GitHub stars/language). */
function RepoFeedbackMiddle({ repo }: { repo: RepoEntry }) {
  const s = repo.feedbackByStatus;
  const tiles: Array<{
    key: string;
    value: string;
    label: string;
    accent?: boolean;
    danger?: boolean;
  }> = [
    {
      key: "submissions",
      value: repo.feedbackCount.toString(),
      label: repo.feedbackCount === 1 ? "submission" : "submissions",
      accent: repo.feedbackCount > 0,
    },
    {
      key: "merged",
      value: s.MERGED.toString(),
      label: s.MERGED === 1 ? "merged PR" : "merged PRs",
    },
    {
      key: "review",
      value: s.WAITING_FOR_REVIEW.toString(),
      label: s.WAITING_FOR_REVIEW === 1 ? "in review" : "in review",
    },
    {
      key: "agent",
      value: s.CODING.toString(),
      label: s.CODING === 1 ? "agent run" : "agent runs",
    },
    {
      key: "failed",
      value: s.FAILED.toString(),
      label: s.FAILED === 1 ? "failed" : "failed",
      danger: s.FAILED > 0,
    },
    {
      key: "domains",
      value: repo.domainCount.toString(),
      label: repo.domainCount === 1 ? "auth. domain" : "auth. domains",
      accent: repo.domainCount === 0 && repo.feedbackCount === 0,
    },
  ];

  return (
    <div className="border-t border-border">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-l border-border">
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className="px-4 py-4 sm:px-5 min-w-0 border-r border-b border-border"
          >
            <p
              className={[
                "text-lg font-bold leading-none tracking-tight tabular-nums",
                tile.accent ? "text-accent" : "",
                tile.danger ? "text-red-400" : "",
                !tile.accent && !tile.danger ? "text-foreground" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {tile.value}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground leading-tight">
              {tile.label}
            </p>
          </div>
        ))}
      </div>

      {repo.latestFeedback ? (
        <div
          className={[
            "border-t border-border lg:items-stretch",
            repo.recentSubmissions.length > 0 ? "lg:grid lg:grid-cols-2" : "",
          ].join(" ")}
        >
          <div
            className={[
              "min-w-0 space-y-2 border-border px-4 py-3",
              repo.recentSubmissions.length > 0 ? "lg:border-r" : "",
            ].join(" ")}
          >
            <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
              <span className="text-[11px] uppercase tracking-wider text-muted shrink-0">
                Latest
              </span>
              <StatusBadge status={repo.latestFeedback.status} />
              <span className="text-[11px] text-muted">
                {formatRelativeTime(repo.latestFeedback.createdAtIso)}
              </span>
            </div>
            <div className="border-l-2 border-accent/50 pl-3">
              <p className="text-xs leading-snug text-muted-foreground italic line-clamp-2">
                &ldquo;{feedbackBodySnippet(repo.latestFeedback.body, 140)}&rdquo;
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {repo.latestFeedback.pagePath ? (
                <span
                  className="font-mono text-[11px] text-muted-foreground border border-border px-2 py-0.5 max-w-[min(100%,18rem)] truncate"
                  title={repo.latestFeedback.pagePath}
                >
                  {repo.latestFeedback.pagePath}
                </span>
              ) : null}
              {repo.latestFeedback.pageUrl &&
              !isLocalDevPageUrl(repo.latestFeedback.pageUrl) ? (
                <a
                  href={repo.latestFeedback.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 max-w-[min(100%,20rem)] truncate text-muted-foreground hover:text-accent transition-colors"
                >
                  {pageUrlLabel(repo.latestFeedback.pageUrl)}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : null}
              {repo.latestFeedback.prUrl ? (
                <a
                  href={repo.latestFeedback.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider bg-accent text-black px-2 py-0.5 font-medium hover:bg-accent-hover transition-colors"
                >
                  View PR
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : null}
            </div>
          </div>

          {repo.recentSubmissions.length > 0 ? (
            <div className="flex min-h-0 min-w-0 flex-col border-t border-border lg:w-full lg:self-start lg:border-t-0">
              <div className="shrink-0 px-4 pt-3 lg:px-4">
                <span className="text-[11px] uppercase tracking-wider text-muted">
                  Recent submissions
                </span>
              </div>
              <div className="relative mx-4 mb-1.5 mt-1.5 h-22 min-h-0 shrink-0 lg:mx-4 lg:mb-1.5 lg:mt-2">
                <ul
                  className="h-full min-h-0 space-y-0 overflow-y-auto overscroll-contain py-0 pb-3 pr-1 [scrollbar-width:thin]"
                  aria-label="More recent submissions"
                >
                  {repo.recentSubmissions.map((sub, i) => (
                    <li
                      key={`${sub.createdAtIso}-${i}`}
                      className="flex min-h-0 min-w-0 flex-nowrap items-center gap-2 border-b border-border/50 py-1 last:border-b-0"
                    >
                      <StatusBadge status={sub.status} compact />
                      <span className="shrink-0 text-[11px] tabular-nums text-muted">
                        {formatRelativeTime(sub.createdAtIso)}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-xs leading-snug text-muted-foreground">
                        {feedbackBodySnippet(sub.body, 80)}
                      </p>
                    </li>
                  ))}
                </ul>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(to_top,var(--color-surface)_0%,rgba(10,10,10,0.72)_28%,rgba(10,10,10,0.28)_62%,rgba(10,10,10,0)_100%)]"
                  aria-hidden
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function RepoCard({ repo }: { repo: RepoEntry }) {
  const router = useRouter();
  const [owner, repoName] = repo.full_name.split("/");
  const feedbacksUrl = dashboardRepoPath(owner ?? "", repoName ?? "");
  const configureUrl = dashboardRepoConfigurePath(owner ?? "", repoName ?? "");
  const { hasAuthorizedDomains } = repo;

  const onCardActivate = () => {
    if (hasAuthorizedDomains) router.push(feedbacksUrl);
  };

  const onCardClick = (e: MouseEvent<HTMLElement>) => {
    if (!hasAuthorizedDomains) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    onCardActivate();
  };

  const onCardKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!hasAuthorizedDomains) return;
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if ((e.target as HTMLElement).closest("a, button")) return;
    onCardActivate();
  };

  return (
    <div
      className={[
        "group relative flex flex-col border border-border bg-surface transition-colors duration-200",
        hasAuthorizedDomains ? "cursor-pointer" : "",
      ].join(" ")}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      role={hasAuthorizedDomains ? "link" : undefined}
      tabIndex={hasAuthorizedDomains ? 0 : undefined}
      aria-label={
        hasAuthorizedDomains ? `Open feedbacks for ${repo.full_name}` : undefined
      }
    >
      <div className="absolute left-0 top-0 h-full w-[3px] bg-transparent transition-colors duration-200 group-hover:bg-accent pointer-events-none" />

      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="h-4 w-4 text-accent shrink-0" />
            <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="text-sm text-muted truncate transition-colors group-hover:text-accent">
                {owner}
              </span>
              <span className="hidden text-muted shrink-0 sm:inline group-hover:text-accent transition-colors">
                /
              </span>
              <span className="text-sm font-bold text-foreground truncate sm:hidden transition-colors group-hover:text-accent">
                /{repoName}
              </span>
              <span className="hidden text-sm font-bold text-foreground truncate sm:inline transition-colors group-hover:text-accent">
                {repoName}
              </span>
            </div>
          </div>
          <a
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors shrink-0"
            aria-label={`Open ${repo.full_name} on GitHub`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
        {repo.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {repo.description}
          </p>
        )}
      </div>

      <div
        className={
          hasAuthorizedDomains
            ? undefined
            : "relative min-h-30 overflow-hidden sm:min-h-32 lg:min-h-0"
        }
      >
        <div
          className={
            hasAuthorizedDomains
              ? undefined
              : "pointer-events-none select-none blur-[1.5px] opacity-50 saturate-[0.85] transition-[filter,opacity]"
          }
          aria-hidden={!hasAuthorizedDomains}
        >
          <RepoFeedbackMiddle repo={repo} />
        </div>
        {!hasAuthorizedDomains ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6 py-6 sm:py-8 lg:px-4 lg:py-2">
            <div
              className="pointer-events-none absolute inset-0 bg-background/35"
              aria-hidden
            />
            <p className="relative z-1 m-0 w-full max-w-[min(100%,26rem)] px-2 text-center text-sm leading-snug text-muted-foreground pointer-events-auto max-lg:text-balance lg:max-w-none lg:px-0 lg:whitespace-nowrap">
              Add authorized domain and add the widget to
              your website.{" "}
              <Link
                href={configureUrl}
                className="font-semibold text-accent underline underline-offset-4 decoration-accent/50 hover:text-accent/90 hover:decoration-accent max-lg:whitespace-nowrap"
              >
                Configure
              </Link>
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border px-6 py-3">
        {repo.pushed_at ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Clock3 className="h-3.5 w-3.5 text-accent" />
            Updated {formatRelativeTime(repo.pushed_at)}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-4">
          {hasAuthorizedDomains ? (
            <Link
              href={feedbacksUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors"
            >
              Feedbacks
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const INSTALL_APP_HREF = "/api/github/install";

type DashboardViewProps = {
  repositories: Array<RepoEntry>;
  hasGithubInstallation: boolean;
  manageAccessUrl: string | null;
  repositoriesError?: string;
};

export default function DashboardView({
  repositories,
  hasGithubInstallation,
  manageAccessUrl,
  repositoriesError,
}: DashboardViewProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  const filteredAndSortedRepos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = repositories.filter((repo) =>
      repo.full_name.toLowerCase().includes(normalizedQuery),
    );
    if (sortBy === "name") {
      return [...filtered].sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    return [...filtered].sort((a, b) => {
      const authDiff =
        Number(b.hasAuthorizedDomains) - Number(a.hasAuthorizedDomains);
      if (authDiff !== 0) return authDiff;
      const timeA = a.pushed_at ? new Date(a.pushed_at).getTime() : 0;
      const timeB = b.pushed_at ? new Date(b.pushed_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [repositories, query, sortBy]);

  return (
    <PageShell>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-accent">[ Dashboard ]</p>
        </div>
        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your Projects</h1>
          <div className="flex w-full justify-end items-center gap-2 sm:w-auto sm:justify-start">
            {hasGithubInstallation && manageAccessUrl ? (
              <a
                href={manageAccessUrl}
                target="_blank"
                rel="noreferrer"
                className={`${buttonVariants({ variant: "default", size: "sm" })} leading-none min-h-8 max-h-8`}
              >
                + Manage Access
              </a>
            ) : (
              <a
                href={INSTALL_APP_HREF}
                className={`${buttonVariants({ variant: "default", size: "sm" })} leading-none min-h-8 max-h-8 border-white bg-white text-black hover:border-zinc-200 hover:bg-zinc-100 hover:text-black focus-visible:ring-white/50`}
              >
                + ADD PROJECT
              </a>
            )}
          </div>
        </div>
      </div>

      {!repositoriesError && repositories.length > 0 && (
        <div className="mb-6 flex flex-row items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <Input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search repository..."
              className="pl-9"
            />
          </div>
          <Select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "recent" | "name")}
            className="w-auto min-w-40 sm:w-48 shrink-0"
          >
            <option value="recent">Recently changed</option>
            <option value="name">Name (A-Z)</option>
          </Select>
        </div>
      )}

      {repositoriesError ? (
        <div className="border border-red-900/50 bg-red-950/30 p-6 text-sm text-red-400">
          {repositoriesError}
        </div>
      ) : !hasGithubInstallation ? (
        <div className="relative overflow-hidden border border-border bg-surface">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,107,0,0.2), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(255,107,0,0.08), transparent)",
            }}
            aria-hidden
          />
          <div className="relative px-6 py-14 sm:px-10 sm:py-16 text-center max-w-lg mx-auto">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border-bright bg-background/90 shadow-sm">
              <Github className="h-7 w-7 text-accent" aria-hidden />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Connect your GitHub repositories
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Install the feedback2code.dev GitHub App, then choose which repos can be
              accessed. You stay in control — no changes are made without your approval.
            </p>
            <a
              href={INSTALL_APP_HREF}
              className={`${buttonVariants({ variant: "default", size: "default" })} mt-8 border-white bg-white text-black hover:border-zinc-200 hover:bg-zinc-100 hover:text-black focus-visible:ring-white/50`}
            >
              + ADD PROJECT
            </a>
            <p className="mt-4 text-xs text-muted-foreground">
              You'll be sent to GitHub to review permissions, then returned here.
            </p>
          </div>
        </div>
      ) : repositories.length === 0 ? (
        <div className="relative overflow-hidden border border-border bg-surface">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.25]"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255,107,0,0.15), transparent)",
            }}
            aria-hidden
          />
          <div className="relative px-6 py-12 sm:px-10 sm:py-14 text-center max-w-lg mx-auto">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border-bright bg-background/90">
              <GitBranch className="h-7 w-7 text-accent" aria-hidden />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              No repositories yet
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Your app is connected, but no repos are selected. On GitHub, choose
              which repositories to grant — or add more from your account settings.
            </p>
            {manageAccessUrl ? (
              <a
                href={manageAccessUrl}
                target="_blank"
                rel="noreferrer"
                className={`${buttonVariants({ variant: "default", size: "default" })} mt-8`}
              >
                + Manage Access
              </a>
            ) : null}
            <p className="mt-5 text-xs text-muted-foreground">
              Need another installation?{" "}
              <a
                href={INSTALL_APP_HREF}
                className="text-accent underline underline-offset-2 hover:text-accent/90"
              >
                Add project via GitHub
              </a>
            </p>
          </div>
        </div>
      ) : filteredAndSortedRepos.length === 0 ? (
        <div className="border border-dashed border-border-bright p-6 text-center">
          <p className="text-sm text-muted-foreground">No repositories match your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
