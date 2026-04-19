/**
 * E2B template alias for the feedback agent (no server-only / Prisma imports).
 * Built with: npm run e2b:build-feedback-template
 */
export const FEEDBACK_AGENT_E2B_TEMPLATE_ALIAS = "feedback2code-agent";

export function feedbackSandboxTemplate(): string {
  const t = process.env.E2B_FEEDBACK_SANDBOX_TEMPLATE?.trim();
  return t || FEEDBACK_AGENT_E2B_TEMPLATE_ALIAS;
}
