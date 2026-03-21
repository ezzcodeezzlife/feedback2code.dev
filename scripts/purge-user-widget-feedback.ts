/**
 * One-off: delete all widget feedback (and quota rows) for one user.
 *
 *   $env:F2C_PURGE_USER_EMAIL="you@example.com"; dotenv -e .env.production -- npx tsx scripts/purge-user-widget-feedback.ts
 *   # or: F2C_PURGE_USER_ID=cuid...
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.F2C_PURGE_USER_EMAIL?.trim();
  const id = process.env.F2C_PURGE_USER_ID?.trim();
  if (!email && !id) {
    console.error("Set F2C_PURGE_USER_EMAIL or F2C_PURGE_USER_ID");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: id ? { id } : { email: email! },
    select: { id: true, email: true },
  });
  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  console.log("Purging for user:", user);

  const lim = await prisma.userFeedbackLimitEvent.deleteMany({
    where: { userId: user.id },
  });

  const repos = await prisma.repositoryConfig.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  const repoIds = repos.map((r) => r.id);

  const fb =
    repoIds.length === 0
      ? { count: 0 }
      : await prisma.widgetFeedback.deleteMany({
          where: { repositoryConfigId: { in: repoIds } },
        });

  console.log("Done:", { limitEventsRemoved: lim.count, widgetFeedbacksRemoved: fb.count });
}

void main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
