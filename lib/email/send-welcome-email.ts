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
  widgetSnippet: string;
  profileUrl: string;
  legalUrl: string;
  testModeNote?: string;
}): string {
  const {
    recipientName,
    dashboardUrl,
    widgetSnippet,
    profileUrl,
    legalUrl,
    testModeNote,
  } = options;

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
                <h1 style="margin:12px 0 6px;font-size:24px;font-weight:700;color:#ededed;">Welcome to feedback2code</h1>
                <p style="margin:0;font-size:14px;color:#a0a0a0;">Turn feedback into code, fast.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi ${recipientName},</p>
                <p style="margin:0 0 16px;color:#a0a0a0;">
                  Your account is ready. Your logged-in home is the dashboard.
                </p>
                <div style="margin:18px 0 8px;">
                  <a href="${dashboardUrl}" style="display:inline-block;background:#ff6b00;color:#000000;text-decoration:none;padding:12px 18px;border:1px solid #ff6b00;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;font-size:12px;">
                    Open dashboard
                  </a>
                </div>
                <p style="margin:10px 0 0;color:#a0a0a0;font-size:14px;line-height:1.6;">
                  Add a new project: click <strong>Manage Access</strong> to grant more repositories, then open a repo to configure
                  authorized domains and copy the widget snippet.
                </p>

                <div style="margin:18px 0 0;padding:14px 16px;border:1px solid #222222;background:#111111;">
                  <p style="margin:0 0 6px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">Add the feedback widget</p>
                  <p style="margin:0 0 10px;color:#ededed;font-size:14px;line-height:1.6;">
                    Paste the one-line JavaScript snippet into your site (right before <code style="font-family:inherit;">&lt;/body&gt;</code>).
                  </p>
                  <div style="border:1px solid #222222;background:#0a0a0a;padding:10px 12px;font-size:12px;color:#ededed;word-break:break-all;">
                    ${widgetSnippet}
                  </div>
                </div>

                <div style="margin:18px 0 0;padding:14px 16px;border:1px solid #222222;background:#111111;">
                  <p style="margin:0 0 10px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">What feedback looks like</p>
                  <div style="border:1px solid #222222;background:#0a0a0a;">
                    <div style="padding:12px 14px;border-bottom:1px solid #222222;">
                      <span style="display:inline-block;padding:3px 8px;border:1px solid #ff6b00;background:rgba(255,107,0,0.12);color:#ff6b00;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Merged</span>
                      <span style="margin-left:8px;color:#888888;font-size:12px;">2h ago</span>
                      <p style="margin:8px 0 0;color:#a0a0a0;font-size:13px;line-height:1.6;">The signup button does not work on mobile - it overlaps with the nav bar on small screens.</p>
                    </div>
                    <div style="padding:12px 14px;border-bottom:1px solid #222222;">
                      <span style="display:inline-block;padding:3px 8px;border:1px solid #333333;background:transparent;color:#ededed;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Awaiting review</span>
                      <span style="margin-left:8px;color:#888888;font-size:12px;">5h ago</span>
                      <p style="margin:8px 0 0;color:#a0a0a0;font-size:13px;line-height:1.6;">Dark mode colors are hard to read on the pricing page. The contrast is too low.</p>
                    </div>
                    <div style="padding:12px 14px;">
                      <span style="display:inline-block;padding:3px 8px;border:1px solid #222222;background:transparent;color:#888888;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Coding</span>
                      <span style="margin-left:8px;color:#888888;font-size:12px;">12m ago</span>
                      <p style="margin:8px 0 0;color:#a0a0a0;font-size:13px;line-height:1.6;">Add a loading spinner while the dashboard data is fetching.</p>
                    </div>
                  </div>
                </div>

                <p style="margin:18px 0 0;color:#a0a0a0;font-size:14px;">
                  Update billing or email settings in your profile:
                  <br />
                  <a href="${profileUrl}" style="color:#ff6b00;text-decoration:none;">Open profile</a>
                </p>

                <div style="margin:18px 0 0;padding:14px 16px;border:1px solid #222222;background:#111111;">
                  <p style="margin:0 0 6px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">Useful links</p>
                  <p style="margin:0 0 6px;font-size:14px;">
                    <a href="${dashboardUrl}" style="color:#ff6b00;text-decoration:none;">Dashboard</a>
                    &nbsp;&bull;&nbsp;
                    <a href="${profileUrl}" style="color:#ff6b00;text-decoration:none;">Profile</a>
                  </p>
                  <p style="margin:0;font-size:14px;">
                    <a href="${legalUrl}" style="color:#ff6b00;text-decoration:none;">Legal & contact</a>
                  </p>
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
            feedback2code
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
  widgetSnippet: string;
  profileUrl: string;
  legalUrl: string;
  testModeNote?: string;
}): string {
  const {
    recipientName,
    dashboardUrl,
    widgetSnippet,
    profileUrl,
    legalUrl,
    testModeNote,
  } = options;

  return `Hi ${recipientName},

Welcome to feedback2code. Your account is ready.

Start here (dashboard): ${dashboardUrl}

Add the feedback widget:
- Copy the one-line JavaScript snippet from your repo page.
- Paste it before </body> on your site.
- Example: ${widgetSnippet}

Add a new project:
- In the dashboard, click "Manage Access" to grant more repositories.
- Open a repo to configure authorized domains and copy the widget snippet.

What feedback looks like:
- Merged: "The signup button does not work on mobile - it overlaps with the nav bar."
- Awaiting review: "Dark mode colors are hard to read on the pricing page."
- Coding: "Add a loading spinner while the dashboard data is fetching."

Useful links:
- Profile: ${profileUrl}
- Legal & contact: ${legalUrl}

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
  const fromEmail = (process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev").trim();
  const fromName = (process.env.RESEND_FROM_NAME ?? "Feedback2Code").trim();
  const from = `${fromName} <${fromEmail}>`;

  const testTo = (process.env.RESEND_TEST_TO ?? "delivered@resend.dev").trim();
  const to = mode === "test" ? [testTo] : [toEmail];

  const subject =
    mode === "test"
      ? process.env.RESEND_WELCOME_SUBJECT_TEST ?? "[test] Welcome to feedback2code"
      : process.env.RESEND_WELCOME_SUBJECT ?? "Welcome to feedback2code";

  const baseUrl = resolveBaseUrl();
  const dashboardUrl = `${baseUrl}/`;
  const profileUrl = `${baseUrl}/profile`;
  const legalUrl = `${baseUrl}/legal`;
  const widgetSnippet = `<script src="${baseUrl}/widget/your_widget_id" async></script>`;

  const rawName = input.intendedRecipientName?.trim();
  const recipientName = rawName && rawName.length > 0 ? rawName : "there";
  const safeRecipientName = escapeHtml(recipientName);

  const intendedRecipientsLine =
    mode === "test" ? `Test mode. Intended recipient: ${toEmail}` : undefined;

  const html = buildWelcomeEmailHtml({
    recipientName: safeRecipientName,
    dashboardUrl,
    widgetSnippet: escapeHtml(widgetSnippet),
    profileUrl,
    legalUrl,
    testModeNote: intendedRecipientsLine,
  });

  const text = buildWelcomeEmailText({
    recipientName,
    dashboardUrl,
    widgetSnippet,
    profileUrl,
    legalUrl,
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
