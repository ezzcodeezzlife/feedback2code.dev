"use client";

import { PageShell } from "@/components/layout/page-shell";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { dashboardRepoPath } from "@/lib/app-paths";
import type { InstalledRepo } from "@/lib/github-app";
import { feedbackStatusLabel, type WidgetFeedbackStatus } from "@/lib/widget-feedback-status";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  GitBranch,
  GitFork,
  Github,
  MessageSquare,
  Search,
  Star,
  Loader2,
} from "lucide-react";

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

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value < 1000) return `${value}`;
  if (value < 1_000_000)
    return `${(Math.round((value / 1000) * 10) / 10)
      .toFixed(1)
      .replace(/\.0$/, "")}k`;
  return `${(Math.round((value / 1_000_000) * 10) / 10)
    .toFixed(1)
    .replace(/\.0$/, "")}m`;
}

function feedbackBodySnippet(body: string): string {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 157)}…`;
}

const INSTALL_APP_HREF = "/api/github/install";

type DashboardViewProps = {
  repositories: Array<
    InstalledRepo & {
      feedbackCount: number;
      latestFeedback: {
        status: WidgetFeedbackStatus;
        createdAtIso: string;
        body: string;
      } | null;
    }
  >;
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  const filteredAndSortedRepos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = repositories.filter((repo) =>
      repo.full_name.toLowerCase().includes(normalizedQuery),
    );

    if (sortBy === "name") {
      return [...filtered].sort((a, b) =>
        a.full_name.localeCompare(b.full_name),
      );
    }

    return [...filtered].sort((a, b) => {
      const timeA = a.pushed_at ? new Date(a.pushed_at).getTime() : 0;
      const timeB = b.pushed_at ? new Date(b.pushed_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [repositories, query, sortBy]);

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-accent">[ Dashboard ]</p>
        </div>
        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Your Projects</h1>
          <div className="flex items-center gap-2">
            {hasGithubInstallation && manageAccessUrl ? (
              <a
                href={manageAccessUrl}
                target="_blank"
                rel="noreferrer"
                className={`${buttonVariants({
                  variant: "default",
                  size: "sm",
                })} leading-none min-h-8 max-h-8`}
              >
                + Manage Access
              </a>
            ) : (
              <a
                href={INSTALL_APP_HREF}
                className={`${buttonVariants({
                  variant: "default",
                  size: "sm",
                })} leading-none min-h-8 max-h-8 border-white bg-white text-black hover:border-zinc-200 hover:bg-zinc-100 hover:text-black focus-visible:ring-white/50`}
              >
                + ADD PROJECT
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Search & sort */}
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
            onChange={(event) =>
              setSortBy(event.target.value as "recent" | "name")
            }
            className="w-auto min-w-40 sm:w-48 shrink-0"
          >
            <option value="recent">Recently changed</option>
            <option value="name">Name (A-Z)</option>
          </Select>
        </div>
      )}

      {/* Repo grid */}
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
              className={`${buttonVariants({
                variant: "default",
                size: "default",
              })} mt-8 border-white bg-white text-black hover:border-zinc-200 hover:bg-zinc-100 hover:text-black focus-visible:ring-white/50`}
            >
              + ADD PROJECT
            </a>
            <p className="mt-4 text-xs text-muted-foreground">
              You’ll be sent to GitHub to review permissions, then returned here.
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
                className={`${buttonVariants({
                  variant: "default",
                  size: "default",
                })} mt-8`}
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
          <p className="text-sm text-muted-foreground">
            No repositories match your search.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedRepos.map((repo) => {
            const [owner, repoName] = repo.full_name.split("/");
            const widgetUrl = dashboardRepoPath(owner ?? "", repoName ?? "");

            return (
              <div
                key={repo.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(widgetUrl)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(widgetUrl);
                  }
                }}
                className="group relative flex cursor-pointer flex-col border border-border bg-surface transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                {/* Orange accent bar (left edge) */}
                <div className="absolute left-0 top-0 h-full w-[3px] bg-transparent transition-colors duration-200 group-hover:bg-accent" />

                {/* Top section */}
                <div className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <GitBranch className="h-4 w-4 text-accent shrink-0" />
                      <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-sm text-muted truncate">{owner}</span>
                        <span className="hidden text-muted shrink-0 sm:inline">/</span>
                        <span className="text-sm font-bold text-foreground transition-colors group-hover:text-accent truncate sm:hidden">
                          /{repoName}
                        </span>
                        <span className="hidden text-sm font-bold text-foreground transition-colors group-hover:text-accent truncate sm:inline">
                          {repoName}
                        </span>
                      </div>
                    </div>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
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

                {/* Two-column stats */}
                <div className="grid grid-cols-2 border-t border-border">
                  <div className="p-6 pr-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-4 w-4 text-accent" />
                      <p className="text-xs font-bold uppercase tracking-wider">Repository</p>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {repo.language && (
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-foreground/80 shrink-0" />
                          {repo.language}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-foreground shrink-0" />
                        {formatCompactNumber(repo.stargazers_count ?? 0)} stars
                      </div>
                      <div className="flex items-center gap-2">
                        <GitFork className="h-3.5 w-3.5 text-foreground shrink-0" />
                        {formatCompactNumber(repo.forks_count ?? 0)} forks
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-foreground shrink-0" />
                        {formatCompactNumber(repo.open_issues_count ?? 0)} open issues
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pl-5 border-l border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-accent" />
                      <p className="text-xs font-bold uppercase tracking-wider">Feedback</p>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>
                        {repo.feedbackCount} submission{repo.feedbackCount === 1 ? "" : "s"}
                      </div>
                      {repo.latestFeedback ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className={[
                              "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] uppercase tracking-wider border",
                              repo.latestFeedback.status === "FAILED"
                                ? "border-red-900/50 bg-red-950/30 text-red-400"
                                : repo.latestFeedback.status === "MERGED"
                                  ? "border-accent/40 bg-accent/10 text-accent"
                                  : repo.latestFeedback.status === "WAITING_FOR_REVIEW"
                                    ? "border-border-bright text-foreground"
                                    : "border-border text-muted-foreground",
                            ].join(" ")}>
                              {repo.latestFeedback.status === "CODING" && (
                                <Loader2
                                  className="h-3 w-3 shrink-0 animate-spin text-accent"
                                  aria-hidden
                                />
                              )}
                              {feedbackStatusLabel(repo.latestFeedback.status)}
                            </span>
                            <span className="text-xs text-muted">
                              {formatRelativeTime(repo.latestFeedback.createdAtIso)}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm text-muted border-l-2 border-accent/30 pl-3">
                            {feedbackBodySnippet(repo.latestFeedback.body)}
                          </p>
                        </>
                      ) : (
                        <div className="text-sm text-muted">No submissions yet</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between border-t border-border px-6 py-3">
                  {repo.pushed_at ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <Clock3 className="h-3.5 w-3.5 text-accent" />
                      Updated {formatRelativeTime(repo.pushed_at)}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                    Configure
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </PageShell>
  );
}
