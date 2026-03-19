"use client";

import {
  FEEDBACK_STATUS_VALUES,
  feedbackStatusLabel,
  parseFeedbackStatus,
  type WidgetFeedbackStatus,
} from "@/lib/widget-feedback-status";
import { useTransition } from "react";

type Props = {
  feedbackId: string;
  value: WidgetFeedbackStatus;
  updateStatus: (feedbackId: string, status: WidgetFeedbackStatus) => Promise<void>;
};

export default function FeedbackStatusSelect({
  feedbackId,
  value,
  updateStatus,
}: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
      <span className="font-medium text-zinc-500 dark:text-zinc-500">Status</span>
      <select
        className="rounded-md border border-black/15 bg-white px-2 py-1 text-sm font-medium text-zinc-900 disabled:opacity-50 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-100"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = parseFeedbackStatus(e.target.value);
          if (!next || next === value) return;
          startTransition(async () => {
            await updateStatus(feedbackId, next);
          });
        }}
      >
        {FEEDBACK_STATUS_VALUES.map((s) => (
          <option key={s} value={s}>
            {feedbackStatusLabel(s)}
          </option>
        ))}
      </select>
    </label>
  );
}
