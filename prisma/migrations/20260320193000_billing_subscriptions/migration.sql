-- Add plan and Stripe subscription fields to users.
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO');

ALTER TABLE "User"
ADD COLUMN "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "stripePriceId" TEXT,
ADD COLUMN "stripeSubscriptionStatus" TEXT,
ADD COLUMN "stripeCurrentPeriodEnd" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
