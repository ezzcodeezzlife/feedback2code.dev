/**
 * One-off: send the welcome email template.
 * Run:
 *   npx dotenv -e .env.production -- node scripts/test-welcome-email.mjs --to=you@example.com --mode=production --name="Fabian"
 */
import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.production") });

function getArg(name) {
  const prefix = `--${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
    if (arg === `--${name}`) return "";
  }
  return undefined;
}

function getEmailMode(raw) {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (normalized === "production" || normalized === "live") return "production";
  if (normalized === "test") return "test";
  const fromEnv = process.env.RESEND_EMAIL_MODE ?? "production";
  return fromEnv.trim().toLowerCase() === "test" ? "test" : "production";
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const toEmail = (getArg("to") ?? "").trim();
if (!toEmail) {
  console.error("Missing --to email. Example: --to=you@example.com");
  process.exit(1);
}

const recipientNameRaw = getArg("name");
const recipientName =
  recipientNameRaw && recipientNameRaw.trim().length > 0
    ? recipientNameRaw.trim()
    : "there";
const safeRecipientName = escapeHtml(recipientName);

const mode = getEmailMode(getArg("mode"));

const apiKey = process.env.RESEND_API_KEY?.trim();
if (!apiKey) {
  console.error("RESEND_API_KEY missing");
  process.exit(1);
}

const fromEmail = (process.env.RESEND_FROM_EMAIL ?? "notifications@feedback2code.dev").trim();
const fromName = (process.env.RESEND_FROM_NAME ?? "Feedback2Code").trim();
const from = `${fromName} <${fromEmail}>`;

const testTo = (process.env.RESEND_TEST_TO ?? "delivered@resend.dev").trim();
const to = mode === "test" ? [testTo] : [toEmail];

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXTAUTH_URL ??
  "https://www.feedback2code.dev"
)
  .trim()
  .replace(/\/$/, "");

const dashboardUrl = `${baseUrl}/`;
const subject =
  mode === "test"
    ? process.env.RESEND_WELCOME_SUBJECT_TEST ?? "[test] Welcome to feedback2code\u200B.dev"
    : process.env.RESEND_WELCOME_SUBJECT ?? "Welcome to feedback2code\u200B.dev";

const testModeNote = mode === "test" ? `Test mode. Intended recipient: ${toEmail}` : "";

const html = `<!doctype html>
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
                <p style="margin:0 0 16px;">Hi ${safeRecipientName},</p>
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

                ${testModeNote ? `<p style="margin:18px 0 0;color:#888888;font-size:12px;">${testModeNote}</p>` : ""}
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

const text = `Hi ${recipientName},

Thanks for signing up. Your first project is connected; the dashboard is your home base.

To start collecting feedback:

1. Open the dashboard and your project.
2. Copy the one-line widget snippet.
3. Paste it just before </body> on your site.

After you ship the widget, people on your site can send feedback. If you have already added the snippet, nothing else is required.

Dashboard: ${dashboardUrl}

Need help? Just reply to this email.${testModeNote ? `\n\n${testModeNote}` : ""}`;

const resend = new Resend(apiKey);

try {
  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });
  console.log("Welcome email sent.", {
    mode,
    to,
    resendId: result?.id ?? null,
  });
} catch (error) {
  console.error("Resend error:", error);
  process.exit(1);
}
