import {
  parseWidgetIdFromBody,
} from "@/lib/widget-embed";
import { authorizeWidgetRequest, widgetCorsHeaders } from "@/lib/widget-resolve";
import { NextRequest, NextResponse } from "next/server";

export function widgetHelloCorsHeaders(
  request: NextRequest,
  allowOrigin: string | null,
) {
  return widgetCorsHeaders(request, allowOrigin);
}

export async function handleWidgetHelloPost(
  request: NextRequest,
): Promise<NextResponse> {
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

  const { ctx } = auth;
  return NextResponse.json(
    {
      ok: true,
      message: `Hello from feedback2code for ${ctx.fullName}.`,
      widgetId: ctx.widgetId,
    },
    { status: 200, headers: ctx.headers },
  );
}
