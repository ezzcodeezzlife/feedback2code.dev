import { buildEmbedScript, WIDGET_ID_RE } from "@/lib/widget-embed";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const widgetId = request.nextUrl.searchParams.get("widgetId") ?? "";

  if (!WIDGET_ID_RE.test(widgetId)) {
    return new Response(
      "/* invalid widgetId */ console.warn('[feedback2code] invalid widgetId');",
      {
        status: 400,
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  }

  const apiOrigin = request.nextUrl.origin;
  const body = buildEmbedScript(apiOrigin, widgetId);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
