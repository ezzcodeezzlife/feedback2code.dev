import { dashboardRepoPath } from "@/lib/app-paths";
import { absoluteUrl, SITE_NAME } from "@/lib/site-config";

const PR_TITLE_MAX = 72;

/** Only allow http(s) URLs in PR markdown (user-supplied `pageUrl`). */
export function safeHttpsUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function truncateTitleCore(body: string): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  const prefix = "Site feedback · ";
  const budget = Math.max(12, PR_TITLE_MAX - prefix.length);
  if (oneLine.length <= budget) {
    return oneLine;
  }
  return `${oneLine.slice(0, budget - 1).trimEnd()}…`;
}

export function buildFeedbackPrTitle(feedbackBody: string): string {
  return `Site feedback · ${truncateTitleCore(feedbackBody)}`;
}

export function buildFeedbackPrBody(input: {
  feedbackBody: string;
  pagePath: string | null;
  pageUrl: string | null;
  owner: string;
  repo: string;
  fullName: string;
  feedbackId: string;
}): string {
  const homeUrl = absoluteUrl("/");
  const githubRepoUrl = `https://github.com/${input.owner}/${input.repo}`;
  const dashboardUrl = absoluteUrl(dashboardRepoPath(input.owner, input.repo));
  const safePage = safeHttpsUrl(input.pageUrl);

  let pageUrlRow = "| **Submitted URL** | — |";
  if (safePage) {
    let label = safePage;
    try {
      const u = new URL(safePage);
      label = `${u.hostname}${u.pathname === "/" ? "" : u.pathname}`;
    } catch {
      /* keep full href */
    }
    pageUrlRow = `| **Submitted URL** | [${label}](${safePage}) |`;
  }

  const pathDisplay =
    input.pagePath && input.pagePath.length > 0
      ? `\`${input.pagePath.replace(/`/g, "'")}\``
      : "—";

  const feedbackQuoted = input.feedbackBody
    .split("\n")
    .map((line) => `> ${line || " "}`)
    .join("\n");

  return [
    `### Pull request from [${SITE_NAME}](${homeUrl})`,
    "",
    `This PR was opened automatically by the **${SITE_NAME}** agent after someone submitted feedback through your embedded site widget.`,
    "",
    "#### Links",
    "",
    "| | |",
    "|:---|:---|",
    `| **Repository** | [\`${input.fullName}\`](${githubRepoUrl}) |`,
    `| **Dashboard** | [View feedback & status](${dashboardUrl}) |`,
    `| **Page path** | ${pathDisplay} |`,
    pageUrlRow,
    "",
    "#### Original feedback",
    "",
    feedbackQuoted,
    "",
    "---",
    "",
    `<sub>Feedback ID \`${input.feedbackId}\` · [${SITE_NAME}](${homeUrl})</sub>`,
    "",
  ].join("\n");
}
