import { authOptions } from "@/auth";
import { getAppBaseUrl, getProPriceId } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type BillingUser = {
  id: string;
  email: string;
  stripeCustomerId: string | null;
  planTier: "FREE" | "PRO";
};

type BillingUserLookup = {
  findUnique(args: {
    where: { email: string };
    select: { id: true; email: true; stripeCustomerId: true; planTier: true };
  }): Promise<BillingUser | null>;
  update(args: { where: { id: string }; data: { stripeCustomerId: string } }): Promise<unknown>;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const billingUserModel = prisma.user as unknown as BillingUserLookup;
  const user = await billingUserModel.findUnique({
    where: { email },
    select: { id: true, email: true, stripeCustomerId: true, planTier: true },
  });
  if (!user?.email) {
    return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  }
  if (user.planTier === "PRO") {
    return NextResponse.json({ ok: true, message: "Already on Pro" });
  }

  const priceId = getProPriceId();
  if (!priceId) {
    return NextResponse.json(
      { ok: false, message: "Missing STRIPE_PRO_PRICE_ID" },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await billingUserModel.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = getAppBaseUrl(request.nextUrl.origin);
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/account?billing=success`,
    cancel_url: `${baseUrl}/account?billing=cancel`,
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ ok: true, url: checkoutSession.url });
}
