import { createHmac, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GitHub App webhooks (optional). This app does not react to events yet; we only
 * acknowledge delivery so GitHub stays green. Set GITHUB_APP_WEBHOOK_SECRET to the
 * secret from the App’s Webhook settings to verify signatures.
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

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: true, hint: "POST GitHub webhook payloads here" });
}
