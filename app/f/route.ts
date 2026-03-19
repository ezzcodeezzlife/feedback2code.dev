import { runE2bFeedbackAgent } from "@/lib/feedback-agent/run-e2b-feedback-agent";
import { parseWidgetIdFromBody } from "@/lib/widget-embed";
import { prisma } from "@/lib/prisma";
import { isLocalDevPageUrl } from "@/lib/widget-origin";
import { authorizeWidgetRequest, widgetCorsHeaders } from "@/lib/widget-resolve";
import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_FEEDBACK_LEN = 2000;
const LIST_LIMIT = 80;

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
    select: { id: true, body: true, createdAt: true },
  });

  return NextResponse.json(
    {
      ok: true,
      items: rows.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt.toISOString(),
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

  const created = await prisma.widgetFeedback.create({
    data: {
      repositoryConfigId: auth.ctx.repositoryConfigId,
      body: text,
      pageUrl: storedPageUrl,
    },
    select: { id: true, body: true, createdAt: true },
  });

  const dashboardPath = `/${auth.ctx.owner}/${auth.ctx.repo}`;
  after(() => {
    void runE2bFeedbackAgent({
      feedbackId: created.id,
      owner: auth.ctx.owner,
      repo: auth.ctx.repo,
      fullName: auth.ctx.fullName,
      feedbackBody: text,
      dashboardPath,
      githubInstallationId: auth.ctx.githubInstallationId,
    }).catch((err) => {
      console.error("[runE2bFeedbackAgent]", err);
    });
  });

  return NextResponse.json(
    {
      ok: true,
      item: {
        id: created.id,
        body: created.body,
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201, headers: auth.ctx.headers },
  );
}
