import { buildEmbedScript, WIDGET_ID_RE } from "@/lib/widget-embed";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ wid: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { wid } = await context.params;
  const widgetId = wid ?? "";

  if (!WIDGET_ID_RE.test(widgetId)) {
    return new Response(
      "/* invalid */console.warn('[f2c] bad id');",
      {
        status: 400,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  }

  // Use configured public base URL so the widget doesn't accidentally call back to localhost.
  const apiOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? request.nextUrl.origin;
  const body = buildEmbedScript(apiOrigin, widgetId);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
