import { loadEnvConfig } from "@next/env";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Pin repo root when another lockfile exists above this folder (avoids wrong Turbopack / tracing root). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(projectRoot);

function allowedDevOrigins(): string[] {
  const fromEnv = process.env.NEXT_DEV_ALLOWED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const fromAuth = (() => {
    try {
      const u = process.env.NEXTAUTH_URL;
      if (!u) return [];
      const host = new URL(u).hostname;
      if (!host || host === "localhost" || host === "127.0.0.1") return [];
      return [host];
    } catch {
      return [];
    }
  })();
  return [
    ...new Set([
      "reel-modelling-cooperation-appointments.trycloudflare.com",
      ...(fromEnv ?? []),
      ...fromAuth,
    ]),
  ];
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
    // CSS `@import "tailwindcss"` can otherwise resolve from a parent folder (no package.json there).
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss", "index.css"),
    },
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Non-localhost dev origins (TryCloudflare, Tailscale, etc.): hostname from NEXTAUTH_URL or NEXT_DEV_ALLOWED_ORIGINS.
  allowedDevOrigins: allowedDevOrigins(),
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
