export const SITE_NAME = "feedback2code";

/** Default / OG / meta description (~155 chars). Lead with the target query. */
export const SITE_DESCRIPTION =
  "Feedback automation for websites: embed a widget, collect user feedback, and let an AI agent open GitHub pull requests you review before anything ships.";

/**
 * Marketing home title. Exact-match query first; brand via root title template.
 * Full SERP title: "{SITE_PAGE_TITLE} | feedback2code"
 */
export const SITE_PAGE_TITLE = "Feedback Automation That Opens GitHub PRs";

/** Longer blurb for JSON-LD / SoftwareApplication structured data. */
export const SITE_LONG_DESCRIPTION =
  "Feedback automation that turns user reports into code. Embed a widget on your site, collect bug reports and ideas, and let an AI coding agent open GitHub pull requests you review before anything ships.";

export function getSiteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getSiteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
