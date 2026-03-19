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
