import { Prisma } from "@prisma/client";

/** Payload produced by `collect-opencode-usage.mjs` in the E2B sandbox. */
export type AgentLlmUsagePayload = {
  sessionId?: string | null;
  opencodeVersion?: string | null;
  providerId?: string | null;
  modelId?: string | null;
  assistantTurns?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  collectedAt?: string;
  error?: string;
};

export function prismaDataFromAgentLlmUsagePayload(
  raw: unknown,
): Pick<
  Prisma.WidgetFeedbackUpdateInput,
  | "agentLlmCostUsd"
  | "agentLlmInputTokens"
  | "agentLlmOutputTokens"
  | "agentLlmTotalTokens"
  | "agentLlmMeta"
> {
  if (raw == null || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  if (typeof o.error === "string" && o.error.length > 0) return {};

  const out: Prisma.WidgetFeedbackUpdateInput = {};

  if (typeof o.costUsd === "number" && Number.isFinite(o.costUsd)) {
    out.agentLlmCostUsd = new Prisma.Decimal(o.costUsd.toFixed(6));
  }

  const inputTokens = o.inputTokens;
  if (typeof inputTokens === "number" && Number.isFinite(inputTokens) && inputTokens >= 0) {
    out.agentLlmInputTokens = Math.floor(inputTokens);
  }

  const outputTokens = o.outputTokens;
  if (typeof outputTokens === "number" && Number.isFinite(outputTokens) && outputTokens >= 0) {
    out.agentLlmOutputTokens = Math.floor(outputTokens);
  }

  const totalTokens = o.totalTokens;
  if (typeof totalTokens === "number" && Number.isFinite(totalTokens) && totalTokens >= 0) {
    out.agentLlmTotalTokens = Math.floor(totalTokens);
  }

  const meta: Record<string, unknown> = {};
  if (typeof o.sessionId === "string") meta.sessionId = o.sessionId;
  if (typeof o.opencodeVersion === "string") meta.opencodeVersion = o.opencodeVersion;
  if (typeof o.providerId === "string") meta.providerId = o.providerId;
  if (typeof o.modelId === "string") meta.modelId = o.modelId;
  if (typeof o.assistantTurns === "number" && Number.isFinite(o.assistantTurns)) {
    meta.assistantTurns = Math.floor(o.assistantTurns);
  }
  if (typeof o.reasoningTokens === "number" && Number.isFinite(o.reasoningTokens)) {
    meta.reasoningTokens = Math.floor(o.reasoningTokens);
  }
  if (typeof o.cacheReadTokens === "number" && Number.isFinite(o.cacheReadTokens)) {
    meta.cacheReadTokens = Math.floor(o.cacheReadTokens);
  }
  if (typeof o.cacheWriteTokens === "number" && Number.isFinite(o.cacheWriteTokens)) {
    meta.cacheWriteTokens = Math.floor(o.cacheWriteTokens);
  }
  if (typeof o.collectedAt === "string") meta.collectedAt = o.collectedAt;

  if (Object.keys(meta).length > 0) {
    out.agentLlmMeta = meta as Prisma.InputJsonValue;
  }

  return out;
}
