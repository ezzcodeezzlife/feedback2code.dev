/**
 * Mirrors Prisma enum WidgetFeedbackStatus — defined here so runtime values work when
 * @prisma/client is externalized/bundled (Turbopack can drop Prisma enum objects).
 */
export type WidgetFeedbackStatus =
  | "CODING"
  | "WAITING_FOR_REVIEW"
  | "MERGED"
  | "FAILED";

export const FEEDBACK_STATUS_VALUES: readonly WidgetFeedbackStatus[] = [
  "CODING",
  "WAITING_FOR_REVIEW",
  "MERGED",
  "FAILED",
];

export function feedbackStatusLabel(status: WidgetFeedbackStatus): string {
  switch (status) {
    case "CODING":
      return "Coding";
    case "WAITING_FOR_REVIEW":
      return "Waiting for review";
    case "MERGED":
      return "Merged";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
}

export function parseFeedbackStatus(raw: string): WidgetFeedbackStatus | null {
  return (FEEDBACK_STATUS_VALUES as readonly string[]).includes(raw)
    ? (raw as WidgetFeedbackStatus)
    : null;
}

export function isWidgetFeedbackStatus(
  value: string,
): value is WidgetFeedbackStatus {
  return (FEEDBACK_STATUS_VALUES as readonly string[]).includes(value);
}
