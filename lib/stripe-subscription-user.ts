import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing"]);

export type SubscriptionUserWrite = {
  planTier: "FREE" | "PRO";
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  stripeSubscriptionStatus: string;
  stripeCurrentPeriodEnd: Date | null;
};

/** Stripe list / thin payloads may omit period end — never pass Invalid Date to Prisma. */
function subscriptionPeriodEndOrNull(sub: Stripe.Subscription): Date | null {
  const firstItem = sub.items?.data?.[0];
  const raw =
    typeof firstItem?.current_period_end === "number"
      ? firstItem.current_period_end
      : (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const d = new Date(raw * 1000);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function subscriptionToUserWrite(sub: Stripe.Subscription): SubscriptionUserWrite {
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const firstItem = sub.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  return {
    planTier: ACTIVE_STATUSES.has(sub.status) ? "PRO" : "FREE",
    stripeCustomerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    stripeSubscriptionStatus: sub.status,
    stripeCurrentPeriodEnd: subscriptionPeriodEndOrNull(sub),
  };
}

/**
 * Persist subscription state on the user row.
 * Prefer `userId` on `checkout.session.completed` (metadata) so we always hit the right row
 * even if `stripeCustomerId` was not written yet or webhook payload is thin.
 */
export async function applySubscriptionToUser(
  sub: Stripe.Subscription,
  userId?: string | null,
) {
  const data = subscriptionToUserWrite(sub);
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data });
    return;
  }
  await prisma.user.updateMany({
    where: { stripeCustomerId: data.stripeCustomerId },
    data,
  });
}

/** If Stripe has an active/trialing sub for this customer, mirror it to the DB (webhook fallback). */
export async function syncActiveSubscriptionFromStripeApi(
  userId: string,
  stripeCustomerId: string,
) {
  const { getStripe } = await import("@/lib/stripe");
  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 20,
  });
  const active = subs.data.find((s) => ACTIVE_STATUSES.has(s.status));
  if (!active) return false;
  // `subscriptions.list` often omits `current_period_end` (invalid Date) or uses thin line items.
  const full = await stripe.subscriptions.retrieve(active.id);
  await applySubscriptionToUser(full, userId);
  return true;
}
