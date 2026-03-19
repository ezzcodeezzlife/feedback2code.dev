"use client";

import { PagePanel, PageShell } from "@/components/layout/page-shell";
import Link from "next/link";
import { useMemo, useState } from "react";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  pushed_at?: string;
};

type DashboardViewProps = {
  repositories: Repo[];
  manageAccessUrl: string;
  repositoriesError?: string;
};

export default function DashboardView({
  repositories,
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
      const timeA = a.pushed_at ? new Date(a.pushed_at).getTime() : 0;
      const timeB = b.pushed_at ? new Date(b.pushed_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [repositories, query, sortBy]);

  return (
    <PageShell>
      <PagePanel>
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Installed Repositories
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Refresh
            </Link>
            <a
              href={manageAccessUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs">
                +
              </span>
              Manage repository access
            </a>
          </div>
        </div>

        {!repositoriesError && repositories.length > 0 ? (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search repositories..."
              className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as "recent" | "name")}
              className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none ring-0 focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
            >
              <option value="recent">Recently changed</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        ) : null}

        {repositoriesError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{repositoriesError}</p>
        ) : repositories.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            No repositories found for this installation yet.
          </p>
        ) : filteredAndSortedRepos.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            No repositories match your search.
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredAndSortedRepos.map((repo) => {
              const [owner, name] = repo.full_name.split("/");
              const widgetUrl = `/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(name ?? "")}`;

              return (
                <li
                  key={repo.id}
                  className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2 dark:border-white/15"
                >
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    {repo.full_name}
                  </a>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {repo.private ? "Private" : "Public"}
                    </span>
                    <Link
                      href={widgetUrl}
                      className="rounded-md border border-black/15 px-2 py-1 text-xs font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                    >
                      Add widget
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PagePanel>
    </PageShell>
  );
}
