import "@/lib/generated/server-env";
import { NextRequest, NextResponse } from "next/server";

const MAX_EMAIL = 254;
const MAX_MESSAGE = 3500;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/** Loose sanity check; not a full RFC parser. */
function isReasonableEmail(s: string): boolean {
  if (s.length < 3 || s.length > MAX_EMAIL) return false;
  const at = s.indexOf("@");
  if (at <= 0 || at === s.length - 1) return false;
  const domain = s.slice(at + 1);
  if (!domain.includes(".")) return false;
  const tld = domain.slice(domain.lastIndexOf(".") + 1);
  return tld.length >= 2 && !/\s/.test(s);
}

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.DISCORD_LEGAL_CONTACT_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, message: "Contact is temporarily unavailable." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const o = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  // Honeypot: if filled, pretend success so bots do not retry.
  const trap = typeof o.website === "string" ? o.website.trim() : "";
  if (trap.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const emailRaw = typeof o.email === "string" ? o.email : "";
  const messageRaw = typeof o.message === "string" ? o.message : "";

  const email = truncate(emailRaw.trim().toLowerCase(), MAX_EMAIL);
  const message = messageRaw.trim();

  if (email.length === 0) {
    return NextResponse.json({ ok: false, message: "Email is required." }, { status: 400 });
  }
  if (!isReasonableEmail(email)) {
    return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  if (message.length === 0) {
    return NextResponse.json({ ok: false, message: "Message is required." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { ok: false, message: `Message is too long (max ${MAX_MESSAGE} characters).` },
      { status: 400 },
    );
  }

  const payload = {
    embeds: [
      {
        title: "Legal page contact",
        description: truncate(message, 4090),
        color: 0xff6b00,
        fields: [{ name: "Email", value: truncate(email, 1020) }],
      },
    ],
  };

  let discordRes: Response;
  try {
    discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Could not deliver your message. Try again later." },
      { status: 502 },
    );
  }

  if (!discordRes.ok) {
    return NextResponse.json(
      { ok: false, message: "Could not deliver your message. Try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
