export type ProFeatureItem = { text: string; comingSoon?: boolean };

/** Full Pro tier bullet list (e.g. pricing cards). */
export const PRO_TIER_FEATURES: readonly ProFeatureItem[] = [
  { text: "100 feedbacks per 30-day window" },
  { text: "Everything in Free" },
  { text: "Priority sandbox execution" },
  { text: "Custom agent instructions" },
  { text: "Page path context tracking" },
  { text: "Choose AI Agent model", comingSoon: true },
];

/** Pro-only extras vs Free (for upsell copy; omits “Everything in Free”). */
export const PRO_UPGRADE_EXTRAS: readonly ProFeatureItem[] =
  PRO_TIER_FEATURES.filter((f) => f.text !== "Everything in Free");
