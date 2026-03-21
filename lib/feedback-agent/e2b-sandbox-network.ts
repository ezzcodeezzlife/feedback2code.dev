/**
 * E2B egress allowlist for the feedback agent sandbox (deny-all + allowOut).
 * Includes DNS resolvers (8.8.8.8) as required for domain-based rules in E2B docs.
 */

const FEEDBACK_AGENT_EGRESS_CORE = [
  "8.8.8.8",
  "8.8.4.4",
  "1.1.1.1",
  "api.minimax.io",
  "api.github.com",
  "github.com",
  /** Git HTTPS pack transfer and release tarballs (often required for clone / npm git deps). */
  "codeload.github.com",
  "objects.githubusercontent.com",
  "raw.githubusercontent.com",
  "registry.npmjs.org",
  "deb.nodesource.com",
  "deb.debian.org",
  "archive.ubuntu.com",
  "security.ubuntu.com",
  "opencode.ai",
  "dev.opencode.ai",
] as const;

export function hostnameFromHttpUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.hostname || null;
  } catch {
    return null;
  }
}

/** Adds `example.com` when host is `www.example.com` and vice versa (TLS may terminate on either). */
function addWwwApexVariants(hostname: string, set: Set<string>): void {
  set.add(hostname);
  if (hostname.startsWith("www.")) {
    const apex = hostname.slice(4);
    if (apex.length > 0) set.add(apex);
  } else if (hostname.length > 0 && !hostname.startsWith("[")) {
    set.add(`www.${hostname}`);
  }
}

/**
 * Builds `network.allowOut` for `Sandbox.create`. Adds the webhook host when `webhookUrl` is set.
 */
export function buildFeedbackAgentEgressAllowOut(webhookUrl: string): string[] {
  const set = new Set<string>(FEEDBACK_AGENT_EGRESS_CORE);
  const h = hostnameFromHttpUrl(webhookUrl);
  if (h) addWwwApexVariants(h, set);
  return [...set];
}
