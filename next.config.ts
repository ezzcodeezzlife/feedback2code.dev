import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Allow the Cloudflare TryCloudflare tunnel domain to access dev resources.
  // (Without this, Next.js may block hot-reload/HMR fetches and break client-side interactions.)
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
