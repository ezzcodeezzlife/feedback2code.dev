/** Free tier: rolling window feedback cap */
export const FEEDBACK_QUOTA_LIMIT_FREE = 10;
/** Pro tier: rolling window feedback cap */
export const FEEDBACK_QUOTA_LIMIT_PRO = 100;
export const FEEDBACK_QUOTA_WINDOW_DAYS = 30;

/** @deprecated use FEEDBACK_QUOTA_LIMIT_FREE or feedbackQuotaLimitForPlan */
export const FEEDBACK_QUOTA_LIMIT = FEEDBACK_QUOTA_LIMIT_FREE;

export function feedbackQuotaLimitForPlan(
  planTier: "FREE" | "PRO" | null | undefined,
): number {
  return planTier === "PRO" ? FEEDBACK_QUOTA_LIMIT_PRO : FEEDBACK_QUOTA_LIMIT_FREE;
}

export function getAppBaseUrl(origin?: string): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    origin ??
    "http://localhost:3000"
  );
}

export function getProPriceId() {
  return process.env.STRIPE_PRO_PRICE_ID ?? "";
}
