export const SITE_NAME = "feedback2code";

export const SITE_DESCRIPTION =
  "Turn user feedback into code changes — automatically";

/** Full `<title>` / share title for the marketing home page (search + tabs + OG). */
export const SITE_PAGE_TITLE = `${SITE_NAME} — Website feedback widget & AI agent that opens GitHub pull requests`;

/** Hero-style blurb for JSON-LD / sharing. */
export const SITE_LONG_DESCRIPTION =
  "Embed a feedback widget on your site. An AI coding agent reads your codebase, implements changes in a secure sandbox, and opens Pull Requests on GitHub — nothing ships without your review.";

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
