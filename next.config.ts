import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma out of the bundler so the client matches schema (fields like WidgetFeedback.status).
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
