import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid bundling Prisma into the server graph (Turbopack can drop model delegates → widgetFeedback undefined).
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
