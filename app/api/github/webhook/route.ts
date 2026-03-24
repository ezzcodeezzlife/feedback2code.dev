import { createHmac, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { DASHBOARD_HOME, dashboardRepoPath } from "@/lib/app-paths";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * GitHub App webhooks.
 * Handles PR lifecycle events so dashboard status updates without waiting for
 * background agents to re-run.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  const raw = await request.text();

  if (secret) {
    const sig = request.headers.get("x-hub-signature-256");
    if (!sig?.startsWith("sha256=")) {
      return NextResponse.json({ error: "missing signature" }, { status: 401 });
    }
    const expected = createHmac("sha256", secret).update(raw).digest("hex");
    const received = sig.slice(7);
    try {
      if (
        expected.length !== received.length ||
        !timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"))
      ) {
        return NextResponse.json({ error: "invalid signature" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  const event = request.headers.get("x-github-event");
  if (event === "pull_request") {
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: true });
    }

    const p = payload as {
      action?: string;
      pull_request?: {
        html_url?: string;
        state?: string;
        merged?: boolean | null;
      };
    };

    const prUrl = p.pull_request?.html_url;
    if (!prUrl) {
      return NextResponse.json({ ok: true });
    }

    const shouldMarkMerged = p.pull_request?.merged === true;
    const shouldMarkWaiting =
      !shouldMarkMerged && p.pull_request?.state === "open";

    if (!shouldMarkMerged && !shouldMarkWaiting) {
      return NextResponse.json({ ok: true });
    }

    const nextStatus = shouldMarkMerged ? "MERGED" : "WAITING_FOR_REVIEW";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.widgetFeedback as any).updateMany({
      where: { prUrl },
      data: { status: nextStatus },
    });

    const linkedConfigs = await prisma.widgetFeedback.findMany({
      where: { prUrl },
      select: {
        repositoryConfig: {
          select: { owner: true, repo: true },
        },
      },
      distinct: ["repositoryConfigId"],
    });

    const repoPaths = new Set<string>();
    for (const row of linkedConfigs) {
      repoPaths.add(
        dashboardRepoPath(row.repositoryConfig.owner, row.repositoryConfig.repo),
      );
    }
    for (const path of repoPaths) {
      revalidatePath(path);
    }
    revalidatePath(DASHBOARD_HOME);
  }

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true, hint: "POST GitHub webhook payloads here" });
}
