import { authOptions } from "@/auth";
import { getAppBaseUrl } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type PortalUserLookup = {
  findUnique(args: {
    where: { email: string };
    select: { stripeCustomerId: true };
  }): Promise<{ stripeCustomerId: string | null } | null>;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const user = await (prisma.user as unknown as PortalUserLookup).findUnique({
    where: { email },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { ok: false, message: "No Stripe customer found for this account." },
      { status: 404 },
    );
  }

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getAppBaseUrl(request.nextUrl.origin)}/account`,
  });

  return NextResponse.json({ ok: true, url: portalSession.url });
}
