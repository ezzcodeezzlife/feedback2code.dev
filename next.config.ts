import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Pin repo root when another lockfile exists above this folder (avoids wrong Turbopack / tracing root). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // TryCloudflare tunnel host must be allowed so dev / HMR requests from that origin are accepted.
  allowedDevOrigins: ["reel-modelling-cooperation-appointments.trycloudflare.com"],
  // Keep Prisma out of the bundler so the client matches schema (fields like WidgetFeedback.status).
  // Do not list `e2b` here: externalizing it triggers require() of ESM-only deps (e.g. chalk) and fails in dev.
  serverExternalPackages: ["@prisma/client", "prisma"],
  // `readFileSync` assets for E2B (not imported as modules).
  outputFileTracingIncludes: {
    "/f": ["./lib/feedback-agent/e2b/**/*"],
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
