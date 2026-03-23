import { Clock3, ExternalLink, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { WidgetFeedbackStatus } from "@/lib/widget-feedback-status";
import { isLocalDevPageUrl } from "@/lib/widget-origin";

export type RepoFeedbackListItem = {
  id: string;
  body: string;
  status: WidgetFeedbackStatus;
  createdAtIso: string;
  prUrl: string | null;
  pagePath: string | null;
  pageUrl: string | null;
};

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

function statusBadgeClass(status: WidgetFeedbackStatus): string {
  switch (status) {
    case "MERGED":
      return "border-accent/40 bg-accent/10 text-accent";
    case "WAITING_FOR_REVIEW":
      return "border-border-bright text-foreground";
    case "CODING":
      return "border-border text-muted-foreground";
    case "FAILED":
      return "border-red-900/50 bg-red-950/30 text-red-400";
    default:
      return "border-border text-muted-foreground";
  }
}

function statusLabel(status: WidgetFeedbackStatus): string {
  switch (status) {
    case "MERGED":
      return "Merged";
    case "WAITING_FOR_REVIEW":
      return "Awaiting review";
    case "CODING":
      return "Coding";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
}

function pageUrlLabel(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
}

export default function RepoFeedbacksPanel({
  feedbacks,
  emptyStateConfigureHref,
}: {
  feedbacks: RepoFeedbackListItem[];
  /** When set (no authorized domains), empty state adds a line linking here. */
  emptyStateConfigureHref?: string;
}) {
  const count = feedbacks.length;

  return (
    <div className="border border-border bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-4">
        <MessageSquare className="h-4 w-4 text-accent" />
        <span className="text-sm font-bold uppercase tracking-wider">
          Submitted Feedback
        </span>
        <span className="ml-1 border border-accent px-1.5 py-0.5 text-xs text-accent">
          {count}
        </span>
      </div>

      {count === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            No feedback yet. After you embed the widget and visitors submit notes,
            they&apos;ll show up here with live status.
            {emptyStateConfigureHref ? (
              <>
                {" "}
                Add at least one authorized domain in{" "}
                <Link
                  href={emptyStateConfigureHref}
                  className="font-medium text-accent underline underline-offset-2 decoration-accent/40 hover:text-accent/90 hover:decoration-accent"
                >
                  Configure
                </Link>{" "}
                so the widget can accept feedback from your site.
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {feedbacks.map((f) => (
            <div
              key={f.id}
              className="px-6 py-4 transition-colors hover:bg-surface-raised/50"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span className="inline-flex shrink-0 items-center gap-1.5">
                    <Clock3 className="h-3 w-3 shrink-0 text-accent" />
                    {formatRelativeTime(f.createdAtIso)}
                  </span>
                  {f.pagePath ? (
                    <span
                      className="max-w-[min(100%,16rem)] truncate border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                      title={f.pagePath}
                    >
                      {f.pagePath}
                    </span>
                  ) : null}
                  {f.pageUrl && !isLocalDevPageUrl(f.pageUrl) ? (
                    <a
                      href={f.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-[min(100%,14rem)] items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-accent transition-colors"
                    >
                      {pageUrlLabel(f.pageUrl)}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] uppercase tracking-wider ${statusBadgeClass(f.status)}`}
                  >
                    {f.status === "CODING" && (
                      <Loader2
                        className="h-3 w-3 shrink-0 animate-spin text-accent"
                        aria-hidden
                      />
                    )}
                    {statusLabel(f.status)}
                  </span>
                  {f.prUrl ? (
                    <a
                      href={f.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider bg-accent px-2 py-0.5 text-black hover:bg-accent-hover transition-colors"
                    >
                      View PR
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : null}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
