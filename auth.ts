import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email/send-welcome-email";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  callbacks: {
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { planTier: true },
      });
      if (session.user) {
        session.user.id = user.id;
        session.user.planTier = dbUser?.planTier ?? "FREE";
      }
      return session;
    },
  },
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
    }),
  ],
  events: {
    async createUser({ user }) {
      const email = user.email?.trim();
      if (!email) return;
      void sendWelcomeEmail({
        intendedToEmail: email,
        intendedRecipientName: user.name ?? null,
      });
    },
  },
};
