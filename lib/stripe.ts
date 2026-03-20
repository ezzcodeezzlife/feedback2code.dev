import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }
  cachedStripe = new Stripe(stripeSecretKey);
  return cachedStripe;
}
