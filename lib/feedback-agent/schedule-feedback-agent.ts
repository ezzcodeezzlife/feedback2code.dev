import { runFeedbackAgentJob } from "@/lib/feedback-agent/feedback-agent-job";
import { after } from "next/server";

/**
 * Starts the E2B agent run without blocking the caller response.
 *
 * Note: this uses `after()` so the work is tied to the current server invocation
 * lifecycle (no external queue/webhook service).
 */
export function scheduleFeedbackAgentJob(feedbackId: string): void {
  after(() => {
    void runFeedbackAgentJob(feedbackId).catch((err) => {
      console.error("[runFeedbackAgentJob]", err);
    });
  });
}
