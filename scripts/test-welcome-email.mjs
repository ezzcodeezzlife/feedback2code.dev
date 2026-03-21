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

const fromEmail = (process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev").trim();
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
const profileUrl = `${baseUrl}/profile`;
const legalUrl = `${baseUrl}/legal`;
const widgetSnippet = `<script src="${baseUrl}/widget/your_widget_id" async></script>`;

const subject =
  mode === "test"
    ? process.env.RESEND_WELCOME_SUBJECT_TEST ?? "[test] Welcome to feedback2code"
    : process.env.RESEND_WELCOME_SUBJECT ?? "Welcome to feedback2code";

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
                <h1 style="margin:12px 0 6px;font-size:24px;font-weight:700;color:#ededed;">Welcome to feedback2code</h1>
                <p style="margin:0;font-size:14px;color:#a0a0a0;">Turn feedback into code, fast.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi ${safeRecipientName},</p>
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
                    ${widgetSnippet.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
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

                ${testModeNote ? `<p style="margin:18px 0 0;color:#888888;font-size:12px;">${testModeNote}</p>` : ""}
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

const text = `Hi ${recipientName},

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

const resend = new Resend(apiKey);

try {
  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });
  console.log("Sent OK.", {
    mode,
    to,
    resendId: result?.id ?? null,
  });
} catch (error) {
  console.error("Resend error:", error);
  process.exit(1);
}
