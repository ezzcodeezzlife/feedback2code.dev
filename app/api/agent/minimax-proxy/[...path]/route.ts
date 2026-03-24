import { validateMinimaxProxyToken } from "@/lib/feedback-agent/minimax-proxy-token";
import { NextRequest, NextResponse } from "next/server";

/** MiniMax Anthropic-compatible API origin (path after proxy = e.g. anthropic/v1/messages). */
const MINIMAX_UPSTREAM_ORIGIN = "https://api.minimax.io";

export const dynamic = "force-dynamic";
/** Vercel hobby max is 300s; raise on Pro if you need longer LLM streams. */
export const maxDuration = 300;

type RouteContext = { params: Promise<{ path: string[] }> };

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

function upstreamUrl(pathSegments: string[], search: string): string {
  const p = pathSegments.length > 0 ? pathSegments.join("/") : "";
  return `${MINIMAX_UPSTREAM_ORIGIN}/${p}${search}`;
}

function extractClientProxyToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  const x = req.headers.get("x-api-key")?.trim();
  return x || null;
}

function buildUpstreamHeaders(req: NextRequest, minimaxKey: string): Headers {
  const h = new Headers();
  h.set("x-api-key", minimaxKey);
  for (const name of [
    "content-type",
    "accept",
    "anthropic-version",
    "anthropic-beta",
  ] as const) {
    const v = req.headers.get(name);
    if (v) h.set(name, v);
  }
  return h;
}

function filterResponseHeaders(upstream: Response): Headers {
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase())) return;
    out.append(key, value);
  });
  return out;
}

async function proxyRequest(req: NextRequest, pathSegments: string[]): Promise<Response> {
  try {
    const minimaxKey = process.env.MINIMAX_API_KEY?.trim();
    if (!minimaxKey) {
      return NextResponse.json({ error: "misconfigured" }, { status: 503 });
    }

    const clientToken = extractClientProxyToken(req);
    if (!clientToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const authz = await validateMinimaxProxyToken(clientToken);
    if (!authz.ok) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const target = upstreamUrl(pathSegments, url.search);
    const headers = buildUpstreamHeaders(req, minimaxKey);

    let body: ArrayBuffer | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      redirect: "manual",
      body: body && body.byteLength > 0 ? body : undefined,
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: filterResponseHeaders(upstream),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[minimax-proxy]", message);
    return NextResponse.json(
      { error: "proxy_failed", detail: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}
