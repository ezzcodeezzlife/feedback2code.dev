import { startE2bFeedbackAgentWebhook } from "@/lib/feedback-agent/run-e2b-feedback-agent";
import { parseWidgetIdFromBody } from "@/lib/widget-embed";
import { prisma } from "@/lib/prisma";
import type { WidgetFeedbackStatus } from "@/lib/widget-feedback-status";
import { isLocalDevPageUrl } from "@/lib/widget-origin";
import { authorizeWidgetRequest, widgetCorsHeaders } from "@/lib/widget-resolve";
import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_FEEDBACK_LEN = 2000;
const MAX_PAGE_PATH_LEN = 2048;
const LIST_LIMIT = 80;
const FEEDBACK_QUOTA_LIMIT = 10;
const FEEDBACK_QUOTA_WINDOW_DAYS = 30;

class FeedbackQuotaExceededError extends Error {
  constructor() {
    super("FEEDBACK_QUOTA_EXCEEDED");
  }
}

function quotaCutoffDate(now = Date.now()) {
  return new Date(now - FEEDBACK_QUOTA_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("Origin");
  return new NextResponse(null, {
    status: 204,
    headers: widgetCorsHeaders(request, origin),
  });
}

export async function GET(request: NextRequest) {
  const widgetId = request.nextUrl.searchParams.get("w") ?? "";
  const auth = await authorizeWidgetRequest(request, widgetId);
  if (!auth.ok) return auth.response;

  const rows = await prisma.widgetFeedback.findMany({
    where: { repositoryConfigId: auth.ctx.repositoryConfigId },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
    select: { id: true, body: true, createdAt: true, status: true },
  });

  return NextResponse.json(
    {
      ok: true,
      items: rows.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
        status: r.status as WidgetFeedbackStatus,
      })),
    },
    { headers: auth.ctx.headers },
  );
}

export async function POST(request: NextRequest) {
  const originHeader = request.headers.get("Origin");
  const failHeaders = widgetCorsHeaders(request, originHeader);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body." },
      { status: 400, headers: failHeaders },
    );
  }

  const widgetId = parseWidgetIdFromBody(body);
  const auth = await authorizeWidgetRequest(request, widgetId);
  if (!auth.ok) return auth.response;

  const o = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const rawText = typeof o.text === "string" ? o.text : "";
  const text = rawText.trim();
  const pageUrl =
    typeof o.pageUrl === "string" && o.pageUrl.length <= 2000 ? o.pageUrl.trim() : null;
  const rawPagePath =
    typeof o.pagePath === "string" && o.pagePath.length <= MAX_PAGE_PATH_LEN
      ? o.pagePath.trim()
      : null;

  if (text.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Feedback text is required." },
      { status: 400, headers: auth.ctx.headers },
    );
  }
  if (text.length > MAX_FEEDBACK_LEN) {
    return NextResponse.json(
      { ok: false, message: `Feedback is too long (max ${MAX_FEEDBACK_LEN} characters).` },
      { status: 400, headers: auth.ctx.headers },
    );
  }

  let storedPageUrl =
    pageUrl && pageUrl.length > 0 ? pageUrl.slice(0, 2000) : null;
  if (storedPageUrl && isLocalDevPageUrl(storedPageUrl)) {
    storedPageUrl = null;
  }

  let storedPagePath =
    rawPagePath && rawPagePath.length > 0
      ? rawPagePath.slice(0, MAX_PAGE_PATH_LEN)
      : null;
  if (storedPagePath && !storedPagePath.startsWith("/")) {
    storedPagePath = `/${storedPagePath}`.slice(0, MAX_PAGE_PATH_LEN);
  }

  const cutoff = quotaCutoffDate();

  let created:
    | {
        id: string;
        body: string;
        createdAt: Date;
        status: WidgetFeedbackStatus;
      }
    | undefined;

  try {
    created = await prisma.$transaction(async (tx) => {
      const usedInWindow = await tx.userFeedbackLimitEvent.count({
        where: {
          userId: auth.ctx.userId,
          createdAt: { gte: cutoff },
        },
      });

      if (usedInWindow >= FEEDBACK_QUOTA_LIMIT) {
        throw new FeedbackQuotaExceededError();
      }

      const created = await tx.widgetFeedback.create({
        data: {
          repositoryConfigId: auth.ctx.repositoryConfigId,
          body: text,
          pageUrl: storedPageUrl,
          pagePath: storedPagePath,
        },
        select: { id: true, body: true, createdAt: true, status: true },
      });

      // Log quota usage so we can count efficiently for rolling windows.
      await tx.userFeedbackLimitEvent.create({
        data: {
          userId: auth.ctx.userId,
          widgetFeedbackId: created.id,
        },
      });

      return created;
    });
  } catch (err) {
    if (err instanceof FeedbackQuotaExceededError) {
      return NextResponse.json(
        {
          ok: false,
          message: `Feedback quota exceeded. You can submit at most ${FEEDBACK_QUOTA_LIMIT} feedbacks per ${FEEDBACK_QUOTA_WINDOW_DAYS} days.`,
        },
        { status: 429, headers: auth.ctx.headers },
      );
    }
    throw err;
  }

  if (!created) {
    // Should be impossible because the quota-exceeded branch returns above,
    // but keep TS control-flow sound.
    throw new Error("Unexpected: feedback creation returned no result.");
  }

  const dashboardPath = `/${auth.ctx.owner}/${auth.ctx.repo}`;
  after(() => {
    void startE2bFeedbackAgentWebhook({
      feedbackId: created.id,
      repositoryConfigId: auth.ctx.repositoryConfigId,
      owner: auth.ctx.owner,
      repo: auth.ctx.repo,
      fullName: auth.ctx.fullName,
      feedbackBody: text,
      pagePath: storedPagePath,
      dashboardPath,
      githubInstallationId: auth.ctx.githubInstallationId,
    }).catch((err) => {
      console.error("[startE2bFeedbackAgentWebhook]", err);
    });
  });

  return NextResponse.json(
    {
      ok: true,
      item: {
        id: created.id,
        body: created.body,
        createdAt: created.createdAt.toISOString(),
        status: created.status,
      },
    },
    { status: 201, headers: auth.ctx.headers },
  );
}
