/**
 * Dev DB: force a user to Free and clear Stripe mirror fields so the account page
 * does not re-apply Pro via Stripe sync.
 *
 *   dotenv -e .env.development -- npx tsx scripts/dev-downgrade-user-to-free.ts you@example.com
 *
 * Or: F2C_USER_EMAIL=you@example.com dotenv -e .env.development -- npx tsx scripts/dev-downgrade-user-to-free.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email =
    process.env.F2C_USER_EMAIL?.trim() ?? process.argv[2]?.trim() ?? "";
  if (!email) {
    console.error(
      "Usage: pass email as first arg or set F2C_USER_EMAIL (see script header).",
    );
    process.exit(1);
  }

  const updated = await prisma.user.updateMany({
    where: { email },
    data: {
      planTier: "FREE",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeSubscriptionStatus: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  if (updated.count === 0) {
    console.error("No user with that email.");
    process.exit(1);
  }

  console.log("OK — set to Free and cleared Stripe fields for:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
