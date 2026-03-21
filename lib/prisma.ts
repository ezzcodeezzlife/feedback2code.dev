import "@/lib/generated/server-env";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma ??= new PrismaClient())
    : new PrismaClient();
