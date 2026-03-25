import { buildFrameInnerHtml, WIDGET_ID_RE } from "@/lib/widget-embed";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const w = request.nextUrl.searchParams.get("w") ?? "";
  if (!WIDGET_ID_RE.test(w)) {
    return new NextResponse("Invalid widget id", { status: 400 });
  }

  const apiOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? request.nextUrl.origin;
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;

  const html = buildFrameInnerHtml(apiOrigin, w, turnstileSiteKey);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "frame-ancestors *",
      "Cache-Control": "private, no-store",
    },
  });
}
