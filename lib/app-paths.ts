/** Logged-in app shell: repo list. */
export const DASHBOARD_HOME = "/dashboard";

export function dashboardRepoPath(owner: string, repo: string): string {
  return `${DASHBOARD_HOME}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
