import { authOptions } from "@/auth";
import { BillingActions } from "@/components/account/billing-actions";
import { SignOutButton } from "@/components/account/sign-out-button";
import { PageShell } from "@/components/layout/page-shell";
import { DASHBOARD_HOME } from "@/lib/app-paths";
import { FEEDBACK_QUOTA_WINDOW_DAYS, feedbackQuotaLimitForPlan } from "@/lib/billing";
import { PRO_UPGRADE_EXTRAS } from "@/lib/plan-features";
import { prisma } from "@/lib/prisma";
import { syncActiveSubscriptionFromStripeApi } from "@/lib/stripe-subscription-user";
import { ArrowLeft, Check, CreditCard, MessageSquare, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

type BillingUser = {
  id: string;
  name: string | null;
  email: string | null;
  githubAppInstalled: boolean;
  planTier: "FREE" | "PRO";
  stripeCustomerId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeCurrentPeriodEnd: Date | null;
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  let user: BillingUser | null = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      githubAppInstalled: true,
      planTier: true,
      stripeCustomerId: true,
      stripeSubscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  // Webhooks often miss local/tunnel dev; reconcile from Stripe when we have a customer id.
  if (user.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      await syncActiveSubscriptionFromStripeApi(user.id, user.stripeCustomerId);
      const refreshed = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
          githubAppInstalled: true,
          planTier: true,
          stripeCustomerId: true,
          stripeSubscriptionStatus: true,
          stripeCurrentPeriodEnd: true,
        },
      });
      if (refreshed) user = refreshed;
    } catch (err) {
      console.error("[account] Stripe subscription sync failed:", err);
    }
  }

  const now = new Date();
  const cutoff = new Date(
    now.getTime() - FEEDBACK_QUOTA_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const usedInWindow = await prisma.userFeedbackLimitEvent.count({
    where: {
      userId: user.id,
      createdAt: { gte: cutoff },
    },
  });

  const oldestInWindow = await prisma.userFeedbackLimitEvent.findFirst({
    where: {
      userId: user.id,
      createdAt: { gte: cutoff },
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const resetAtIso = oldestInWindow
    ? new Date(
        oldestInWindow.createdAt.getTime() +
          FEEDBACK_QUOTA_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString()
    : null;

  const isPro = user.planTier === "PRO";
  const quotaLimit = feedbackQuotaLimitForPlan(user.planTier);
  const remaining = Math.max(0, quotaLimit - usedInWindow);
  const quotaPercent =
    quotaLimit > 0
      ? Math.min(100, Math.round((usedInWindow / quotaLimit) * 100))
      : 0;

  return (
    <PageShell>
      {/* Match dashboard repo settings header */}
      <div className="mb-8">
        <Link
          href={DASHBOARD_HOME}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to dashboard
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-accent">[ Account ]</p>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Your Account</h1>
      </div>

      {/* Stacked panels like repo settings (shared borders, no gap) */}
      <div className="space-y-0">
        <section className="border border-border bg-surface p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Profile</h2>
            </div>
            <SignOutButton />
          </div>
          <p className="text-xs text-muted mb-4">
            Signed-in identity and GitHub App install status.
          </p>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Name</dt>
              <dd className="mt-1 text-sm text-foreground">{user.name ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Email</dt>
              <dd className="mt-1 text-sm text-foreground">{user.email}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-muted">GitHub App</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {user.githubAppInstalled ? "Installed" : "Not installed"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="border border-border border-t-0 bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Feedback Quota</h2>
            </div>
            <span className="text-xs text-accent border border-accent px-1.5 py-0.5 shrink-0">
              {usedInWindow} / {quotaLimit}
              {isPro ? " Pro" : ""}
            </span>
          </div>
          <p className="text-xs text-muted mb-4">
            Rolling {FEEDBACK_QUOTA_WINDOW_DAYS}-day window per plan. Widget submissions count toward
            this limit.
          </p>
          <div className="h-1.5 w-full overflow-hidden bg-border">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{remaining} remaining</span>
            {isPro ? (
              <span>Pro · 30-day rolling window</span>
            ) : resetAtIso ? (
              <span>Resets {new Date(resetAtIso).toISOString().slice(0, 10)}</span>
            ) : (
              <span>30-day rolling window</span>
            )}
          </div>
        </section>

        <section className="border border-border border-t-0 bg-surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Billing</h2>
          </div>
          <p className="text-xs text-muted mb-4">
            Plan and subscription managed with Stripe. Upgrade or open the customer portal below.
          </p>
          <div className="text-sm text-foreground">
            Current plan:{" "}
            <span className="font-semibold">{user.planTier === "PRO" ? "Pro" : "Free"}</span>
          </div>
          {user.planTier === "PRO" ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Status: {user.stripeSubscriptionStatus ?? "active"}
              {user.stripeCurrentPeriodEnd
                ? ` · Renews ${user.stripeCurrentPeriodEnd.toISOString().slice(0, 10)}`
                : ""}
            </p>
          ) : (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                Everything extra with Pro
              </p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {PRO_UPGRADE_EXTRAS.map((f) => (
                  <li key={f.text} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-accent/80 shrink-0 mt-0.5" />
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{f.text}</span>
                      {f.comingSoon ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm">
                          Coming soon
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4">
            <BillingActions isPro={isPro} />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
