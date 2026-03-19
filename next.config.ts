import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma out of the bundler so the client matches schema (fields like WidgetFeedback.status).
  // Do not list `e2b` here: externalizing it triggers require() of ESM-only deps (e.g. chalk) and fails in dev.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // `readFileSync` assets for E2B (not imported as modules).
  outputFileTracingIncludes: {
    "/f": ["./lib/feedback-agent/e2b/**/*"],
  },
};

export default nextConfig;
