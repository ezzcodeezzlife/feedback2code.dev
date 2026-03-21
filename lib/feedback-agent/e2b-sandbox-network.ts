/**
 * E2B egress allowlist for the feedback agent sandbox (deny-all + allowOut).
 * Includes DNS resolvers (8.8.8.8) as required for domain-based rules in E2B docs.
 */

const FEEDBACK_AGENT_EGRESS_CORE = [
  "8.8.8.8",
  "8.8.4.4",
  "api.minimax.io",
  "api.github.com",
  "github.com",
  "registry.npmjs.org",
  "deb.nodesource.com",
  "deb.debian.org",
  "archive.ubuntu.com",
  "security.ubuntu.com",
  "opencode.ai",
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

/**
 * Builds `network.allowOut` for `Sandbox.create`. Adds the webhook host when `webhookUrl` is set.
 */
export function buildFeedbackAgentEgressAllowOut(webhookUrl: string): string[] {
  const set = new Set<string>(FEEDBACK_AGENT_EGRESS_CORE);
  const h = hostnameFromHttpUrl(webhookUrl);
  if (h) set.add(h);
  return [...set];
}
