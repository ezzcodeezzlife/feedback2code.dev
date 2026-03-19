import { runFeedbackAgentJob } from "@/lib/feedback-agent/feedback-agent-job";
import { after } from "next/server";

function appBaseUrl(): string | null {
  const u =
    process.env.APP_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (u) return u;
  const v = process.env.VERCEL_URL;
  if (v) return `https://${v.replace(/\/$/, "")}`;
  return null;
}

/**
 * Enqueues the E2B agent run without blocking the widget response.
 *
 * - If `QSTASH_TOKEN`, `FEEDBACK_AGENT_JOB_SECRET`, and a public app URL are set,
 *   publishes to [Upstash QStash](https://upstash.com/docs/qstash), which calls
 *   `/api/jobs/run-feedback-agent` in a **new** server invocation (own `maxDuration`).
 * - Otherwise falls back to `after(() => runFeedbackAgentJob)` (same invocation; limited by host).
 */
export function scheduleFeedbackAgentJob(feedbackId: string): void {
  const qstashToken = process.env.QSTASH_TOKEN;
  const jobSecret = process.env.FEEDBACK_AGENT_JOB_SECRET;
  const base = appBaseUrl();

  after(() => {
    void (async () => {
      if (qstashToken && jobSecret && base) {
        const target = `${base}/api/jobs/run-feedback-agent`;
        try {
          const res = await fetch(
            `https://qstash.upstash.io/v2/publish/${encodeURIComponent(target)}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${qstashToken}`,
                "Content-Type": "application/json",
                "Upstash-Forward-Authorization": `Bearer ${jobSecret}`,
              },
              body: JSON.stringify({ feedbackId }),
            },
          );
          if (!res.ok) {
            const t = await res.text();
            console.error("[scheduleFeedbackAgentJob] QStash failed:", res.status, t);
            await runFeedbackAgentJob(feedbackId);
          }
          return;
        } catch (e) {
          console.error("[scheduleFeedbackAgentJob] QStash error:", e);
          await runFeedbackAgentJob(feedbackId);
          return;
        }
      }

      try {
        await runFeedbackAgentJob(feedbackId);
      } catch (err) {
        console.error("[runFeedbackAgentJob]", err);
      }
    })();
  });
}
