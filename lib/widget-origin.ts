export const BASE_HOSTING_DOMAINS = [
  "vercel.app",
  "app.vercel.app",
  "netlify.app",
  "github.io",
  "pages.dev",
  "web.app",
  "firebaseapp.com",
  "herokuapp.com",
];

export function cleanDomain(value: string): string {
  let d = value.trim().toLowerCase();
  // Remove protocol
  d = d.replace(/^(https?:\/\/)/, "");
  // Remove www.
  d = d.replace(/^www\./, "");
  // Remove trailing slashes and paths
  d = d.split("/")[0];
  // Remove trailing dots
  d = d.replace(/\.+$/, "");
  return d;
}

export function getDomainWarning(domain: string): string | null {
  const d = cleanDomain(domain);
  if (!d) return null;

  if (d === "localhost" || d === "127.0.0.1") {
    return "This is for local development only. Make sure to add your production domain for the widget to work on your live site.";
  }

  if (BASE_HOSTING_DOMAINS.includes(d)) {
    return `Adding a base hosting domain is unsafe because any project on this service could potentially send feedback to your widget. Use your specific subdomain instead (e.g., your-project.${d}).`;
  }

  return null;
}

/**
 * Hostname only, lowercase, no port (for comparing to authorizedDomains).
 */
export function hostnameFromUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** True for localhost / loopback page URLs — omit from stored feedback and dashboard. */
export function isLocalDevPageUrl(urlString: string): boolean {
  const host = hostnameFromUrl(urlString);
  if (!host) return false;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost")
  );
}

export function originHostFromRequest(
  origin: string | null,
  referer: string | null,
): string | null {
  if (origin && origin !== "null") {
    return hostnameFromUrl(origin);
  }
  if (referer) {
    return hostnameFromUrl(referer);
  }
  return null;
}

/**
 * Exact hostname match, or subdomain of an authorized entry (e.g. app.example.com vs example.com).
 */
export function isHostnameAuthorized(
  requestHost: string,
  authorizedDomains: string[],
): boolean {
  const host = requestHost.toLowerCase().trim();
  if (!host) return false;

  for (const entry of authorizedDomains) {
    const d = entry.toLowerCase().trim();
    if (!d) continue;
    if (host === d) return true;
    if (host.endsWith(`.${d}`)) return true;
  }
  return false;
}
