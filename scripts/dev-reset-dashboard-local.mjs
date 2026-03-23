/**
 * Dev-only: clear GitHub app install flags + all repo configs / widget feedback / quota events for one user.
 *
 *   dotenv -e .env.development -- node scripts/dev-reset-dashboard-local.mjs you@example.com
 */
import { PrismaClient } from "@prisma/client";

const email = process.argv[2]?.trim();
if (!email) {
  console.error(
    "Usage: dotenv -e .env.development -- node scripts/dev-reset-dashboard-local.mjs <email>",
  );
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    console.error("No user with that email.");
    process.exit(1);
  }

  await prisma.userFeedbackLimitEvent.deleteMany({ where: { userId: user.id } });
  await prisma.widgetFeedback.deleteMany({
    where: { repositoryConfig: { userId: user.id } },
  });
  await prisma.repositoryConfig.deleteMany({ where: { userId: user.id } });
  await prisma.user.update({
    where: { id: user.id },
    data: {
      githubAppInstalled: false,
      githubInstallationId: null,
    },
  });

  console.log("Reset OK:", user.email);
} finally {
  await prisma.$disconnect();
}
