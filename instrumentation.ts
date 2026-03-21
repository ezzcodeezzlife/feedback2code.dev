import { loadEnvConfig } from "@next/env";

/**
 * Vercel/serverless often does not populate process.env from committed `.env.production`.
 * Load it once per Node runtime so NextAuth and Prisma see secrets at request time.
 */
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    loadEnvConfig(process.cwd());
  }
}
