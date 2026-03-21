import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(secretKey);

async function ensureProduct(name, metadata) {
  const existing = await stripe.products.search({
    query: `active:'true' AND metadata['tier']:'${metadata.tier}'`,
    limit: 1,
  });
  if (existing.data[0]) return existing.data[0];
  return stripe.products.create({ name, metadata });
}

async function ensureRecurringPrice(productId, lookupKey, amountCents) {
  const list = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (list.data[0]) return list.data[0];
  return stripe.prices.create({
    product: productId,
    unit_amount: amountCents,
    currency: "usd",
    recurring: { interval: "month" },
    lookup_key: lookupKey,
    nickname: "Pro Monthly",
  });
}

async function main() {
  const freeProduct = await ensureProduct("feedback2code Free", { tier: "FREE" });
  const proProduct = await ensureProduct("feedback2code Pro", { tier: "PRO" });
  const proPrice = await ensureRecurringPrice(proProduct.id, "feedback2code_pro_monthly_20_usd", 2000);

  console.log("Free product:", freeProduct.id);
  console.log("Pro product:", proProduct.id);
  console.log("Pro monthly price:", proPrice.id);
  console.log("Set STRIPE_PRO_PRICE_ID=", proPrice.id);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
