import { prisma } from "@/lib/prisma";
import { WIDGET_ID_RE } from "@/lib/widget-embed";
import {
  isHostnameAuthorized,
  originHostFromRequest,
} from "@/lib/widget-origin";
import { NextRequest, NextResponse } from "next/server";

export function widgetCorsHeaders(
  request: NextRequest,
  allowOrigin: string | null,
) {
  const headers = new Headers();
  if (allowOrigin) {
    headers.set("Access-Control-Allow-Origin", allowOrigin);
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return headers;
}

export type AuthorizedWidgetContext = {
  headers: Headers;
  widgetId: string;
  repositoryConfigId: string;
  fullName: string;
  owner: string;
  repo: string;
  /** GitHub App installation for this dashboard user; used for agent git + PRs. */
  githubInstallationId: string | null;
};

export async function authorizeWidgetRequest(
  request: NextRequest,
  widgetId: string,
): Promise<
  | { ok: true; ctx: AuthorizedWidgetContext }
  | { ok: false; response: NextResponse }
> {
  const originHeader = request.headers.get("Origin");
  const headers = widgetCorsHeaders(request, originHeader);

  if (!WIDGET_ID_RE.test(widgetId)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "Invalid widget id." },
        { status: 400, headers },
      ),
    };
  }

  const config = await prisma.repositoryConfig.findUnique({
    where: { widgetId },
    select: {
      id: true,
      authorizedDomains: true,
      fullName: true,
      owner: true,
      repo: true,
      user: { select: { githubInstallationId: true } },
    },
  });

  if (!config) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "Unknown widget." },
        { status: 404, headers },
      ),
    };
  }

  const domains =
    Array.isArray(config.authorizedDomains) &&
    config.authorizedDomains.every((d) => typeof d === "string")
      ? (config.authorizedDomains as string[])
      : [];

  if (domains.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message:
            "No authorized domains configured. Add domains in the dashboard for this repository.",
        },
        { status: 403, headers },
      ),
    };
  }

  const referer = request.headers.get("Referer");
  const requestHost = originHostFromRequest(originHeader, referer);

  if (!requestHost) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message:
            "Could not determine request origin. Ensure the page sends an Origin or Referer header.",
        },
        { status: 403, headers },
      ),
    };
  }

  if (!isHostnameAuthorized(requestHost, domains)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          message: `Origin "${requestHost}" is not in this widget's authorized domains.`,
        },
        { status: 403, headers },
      ),
    };
  }

  return {
    ok: true,
    ctx: {
      headers,
      widgetId,
      repositoryConfigId: config.id,
      fullName: config.fullName,
      owner: config.owner,
      repo: config.repo,
      githubInstallationId: config.user.githubInstallationId,
    },
  };
}
