import {
  handleWidgetHelloPost,
  widgetHelloCorsHeaders,
} from "@/lib/widget-hello";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("Origin");
  return new NextResponse(null, {
    status: 204,
    headers: widgetHelloCorsHeaders(request, origin),
  });
}

export async function POST(request: NextRequest) {
  return handleWidgetHelloPost(request);
}
