import { authOptions } from "@/auth";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { MessageSquare, User } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const FEEDBACK_QUOTA_LIMIT = 10;
const FEEDBACK_QUOTA_WINDOW_DAYS = 30;

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      githubAppInstalled: true,
    },
  });

  if (!user) {
    redirect("/");
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

  const remaining = Math.max(0, FEEDBACK_QUOTA_LIMIT - usedInWindow);
  const quotaPercent =
    FEEDBACK_QUOTA_LIMIT > 0
      ? Math.min(100, Math.round((usedInWindow / FEEDBACK_QUOTA_LIMIT) * 100))
      : 0;

  return (
    <PageShell className="gap-6">
      <section className="border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold uppercase tracking-wider">Account</h1>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Name</dt>
            <dd className="mt-1 text-foreground">{user.name ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">Email</dt>
            <dd className="mt-1 text-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted">
              GitHub App
            </dt>
            <dd className="mt-1 text-foreground">
              {user.githubAppInstalled ? "Installed" : "Not installed"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Feedback Quota
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {usedInWindow} / {FEEDBACK_QUOTA_LIMIT} used
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden bg-border">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{remaining} remaining</span>
          {resetAtIso ? (
            <span>Resets {new Date(resetAtIso).toISOString().slice(0, 10)}</span>
          ) : (
            <span>30-day rolling window</span>
          )}
        </div>
      </section>

      <section className="border border-border bg-surface p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider">Billing</h2>
      </section>
    </PageShell>
  );
}
