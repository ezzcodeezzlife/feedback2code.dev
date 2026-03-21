import { Resend } from "resend";

type SendWelcomeEmailInput = {
  intendedToEmail: string;
  intendedRecipientName?: string | null;
};

function getEmailMode(): "test" | "production" {
  const raw = process.env.RESEND_EMAIL_MODE ?? "production";
  const normalized = raw.trim().toLowerCase();
  return normalized === "test" ? "test" : "production";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "https://www.feedback2code.dev";
  return raw.trim().replace(/\/$/, "");
}

function buildWelcomeEmailHtml(options: {
  recipientName: string;
  dashboardUrl: string;
  testModeNote?: string;
}): string {
  const { recipientName, dashboardUrl, testModeNote } = options;

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#000000;color:#ededed;font-family:'Fira Code','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#000000;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#0a0a0a;border:1px solid #222222;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #222222;">
                <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#ff6b00;">[ welcome ]</div>
                <h1 style="margin:12px 0 6px;font-size:24px;font-weight:700;color:#ededed;">Welcome to feedback2code&#8203;.dev</h1>
                <p style="margin:0;font-size:14px;color:#a0a0a0;">Turn feedback into code.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi ${recipientName},</p>
                <p style="margin:0 0 16px;color:#a0a0a0;">
                  Thanks for signing up. Your first project is connected; the dashboard is your home base.
                </p>
                <p style="margin:0 0 10px;color:#a0a0a0;font-size:14px;line-height:1.6;">
                  To start collecting feedback:
                </p>
                <p style="margin:0 0 6px;color:#a0a0a0;font-size:14px;line-height:1.6;">
                  <span style="display:inline-block;min-width:1.5em;color:#ff6b00;font-weight:700;">1.</span>
                  Open the dashboard and your project.
                </p>
                <p style="margin:0 0 6px;color:#a0a0a0;font-size:14px;line-height:1.6;">
                  <span style="display:inline-block;min-width:1.5em;color:#ff6b00;font-weight:700;">2.</span>
                  Copy the one-line widget snippet.
                </p>
                <p style="margin:0 0 16px;color:#a0a0a0;font-size:14px;line-height:1.6;">
                  <span style="display:inline-block;min-width:1.5em;color:#ff6b00;font-weight:700;">3.</span>
                  Paste it just before <code style="font-family:inherit;">&lt;/body&gt;</code> on your site.
                </p>
                <p style="margin:0 0 16px;color:#a0a0a0;font-size:14px;line-height:1.6;">
                  After you ship the widget, people on your site can send feedback. If you have already added the snippet, nothing
                  else is required.
                </p>

                <div style="margin:18px 0 8px;">
                  <a href="${dashboardUrl}" style="display:inline-block;background:#ff6b00;color:#000000;text-decoration:none;padding:12px 18px;border:1px solid #ff6b00;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;font-size:12px;">
                    Open dashboard
                  </a>
                </div>

                <p style="margin:18px 0 0;color:#a0a0a0;font-size:14px;">
                  Need help? Just reply to this email.
                </p>

                ${
                  testModeNote
                    ? `<p style="margin:18px 0 0;color:#888888;font-size:12px;">${testModeNote}</p>`
                    : ""
                }
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#555555;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
            feedback2code&#8203;.dev
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildWelcomeEmailText(options: {
  recipientName: string;
  dashboardUrl: string;
  testModeNote?: string;
}): string {
  const { recipientName, dashboardUrl, testModeNote } = options;

  return `Hi ${recipientName},

Thanks for signing up. Your first project is connected; the dashboard is your home base.

To start collecting feedback:

1. Open the dashboard and your project.
2. Copy the one-line widget snippet.
3. Paste it just before </body> on your site.

After you ship the widget, people on your site can send feedback. If you have already added the snippet, nothing else is required.

Dashboard: ${dashboardUrl}

Need help? Just reply to this email.${testModeNote ? `\n\n${testModeNote}` : ""}`;
}

export async function sendWelcomeEmail(input: SendWelcomeEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping welcome email");
    return;
  }

  const toEmail = input.intendedToEmail?.trim();
  if (!toEmail) {
    console.warn("[email] Missing recipient email; skipping welcome email");
    return;
  }

  const mode = getEmailMode();
  const fromEmail = (process.env.RESEND_FROM_EMAIL ?? "notifications@feedback2code.dev").trim();
  const fromName = (process.env.RESEND_FROM_NAME ?? "Feedback2Code").trim();
  const from = `${fromName} <${fromEmail}>`;

  const testTo = (process.env.RESEND_TEST_TO ?? "delivered@resend.dev").trim();
  const to = mode === "test" ? [testTo] : [toEmail];

  const subject =
    mode === "test"
      ? process.env.RESEND_WELCOME_SUBJECT_TEST ?? "[test] Welcome to feedback2code\u200B.dev"
      : process.env.RESEND_WELCOME_SUBJECT ?? "Welcome to feedback2code\u200B.dev";

  const baseUrl = resolveBaseUrl();
  const dashboardUrl = `${baseUrl}/`;

  const rawName = input.intendedRecipientName?.trim();
  const recipientName = rawName && rawName.length > 0 ? rawName : "there";
  const safeRecipientName = escapeHtml(recipientName);

  const intendedRecipientsLine =
    mode === "test" ? `Test mode. Intended recipient: ${toEmail}` : undefined;

  const html = buildWelcomeEmailHtml({
    recipientName: safeRecipientName,
    dashboardUrl,
    testModeNote: intendedRecipientsLine,
  });

  const text = buildWelcomeEmailText({
    recipientName,
    dashboardUrl,
    testModeNote: intendedRecipientsLine,
  });

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
    console.log("[email] Welcome email sent", {
      mode,
      to,
      resendId:
        (() => {
          const r = result as unknown as { id?: unknown };
          return typeof r.id === "string" ? r.id : null;
        })(),
    });
  } catch (e) {
    console.error("[email] Failed to send welcome email", {
      mode,
      to,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
