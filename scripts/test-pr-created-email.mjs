/**
 * One-off: send the PR-created email template.
 * Run:
 *   npx dotenv -e .env.production -- node scripts/test-pr-created-email.mjs --to=you@example.com --mode=production --name="Fabian" --repo=vercel/next.js --pr=https://github.com/vercel/next.js/pull/1 --feedback="The signup button overlaps the nav on mobile."
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

const repositoryFullName = (getArg("repo") ?? "feedback2code/feedback2code").trim();
const prUrl = (getArg("pr") ?? "https://github.com/feedback2code/feedback2code/pull/123").trim();
const feedbackBody = (
  getArg("feedback") ?? "The signup button overlaps the nav on mobile and the page scroll locks after the popup opens."
).trim();
const recipientNameRaw = getArg("name");
const recipientName =
  recipientNameRaw && recipientNameRaw.trim().length > 0 ? recipientNameRaw.trim() : "there";
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

const [owner = "", repo = ""] = repositoryFullName.split("/");
const dashboardUrl = `${baseUrl}/`;
const repositoryDashboardUrl =
  owner && repo ? `${baseUrl}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` : dashboardUrl;
const githubRepoUrl =
  owner && repo ? `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` : "https://github.com";
const profileUrl = `${baseUrl}/profile`;
const legalUrl = `${baseUrl}/legal`;

const subject =
  mode === "test"
    ? process.env.RESEND_PR_CREATED_SUBJECT_TEST ?? "[test] PR-created notification"
    : process.env.RESEND_PR_CREATED_SUBJECT ?? "Your feedback PR is ready";

const testModeNote = mode === "test" ? `Test mode. Intended recipient(s): ${toEmail}` : "";

const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#000000;color:#ededed;font-family:'Fira Code','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#000000;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#0a0a0a;border:1px solid #222222;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #222222;">
                <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#ff6b00;">[ pr ready ]</div>
                <h1 style="margin:12px 0 6px;font-size:24px;font-weight:700;color:#ededed;">Your feedback PR is ready</h1>
                <p style="margin:0;font-size:14px;color:#a0a0a0;">A new automated change is waiting for review.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi ${safeRecipientName},</p>
                <p style="margin:0 0 16px;color:#a0a0a0;">
                  feedback2code finished turning the latest submission into a GitHub pull request for <strong style="color:#ededed;">${escapeHtml(repositoryFullName)}</strong>.
                </p>

                <div style="margin:18px 0 8px;">
                  <a href="${escapeHtml(prUrl)}" style="display:inline-block;background:#ff6b00;color:#000000;text-decoration:none;padding:12px 18px;border:1px solid #ff6b00;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;font-size:12px;">
                    Review pull request
                  </a>
                </div>

                <div style="margin:18px 0 0;padding:16px;border:1px solid #222222;background:#111111;">
                  <p style="margin:0 0 8px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">What to do next</p>
                  <p style="margin:0 0 8px;color:#ededed;font-size:14px;">Open the PR, scan the diff, and merge only if the generated change looks right.</p>
                  <p style="margin:0;color:#a0a0a0;font-size:13px;">You stay in control. Nothing ships until you approve it on GitHub.</p>
                </div>

                <div style="margin:18px 0 0;padding:16px;border:1px solid #222222;background:#111111;">
                  <p style="margin:0 0 10px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">Project snapshot</p>
                  <div style="border:1px solid #222222;background:#0a0a0a;">
                    <div style="padding:12px 14px;border-bottom:1px solid #222222;">
                      <span style="display:inline-block;padding:3px 8px;border:1px solid #ff6b00;background:rgba(255,107,0,0.12);color:#ff6b00;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Ready for review</span>
                      <span style="margin-left:8px;color:#888888;font-size:12px;">Pull request created</span>
                      <p style="margin:8px 0 0;color:#ededed;font-size:14px;word-break:break-word;">${escapeHtml(prUrl)}</p>
                    </div>
                    <div style="padding:12px 14px;">
                      <p style="margin:0;color:#a0a0a0;font-size:13px;line-height:1.6;">Repository: ${escapeHtml(repositoryFullName)}</p>
                    </div>
                  </div>
                </div>

                <div style="margin:18px 0 0;padding:16px;border:1px solid #222222;background:#111111;">
                  <p style="margin:0 0 10px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">Original feedback</p>
                  <div style="border:1px solid #222222;background:#0a0a0a;padding:14px;color:#ededed;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(feedbackBody)}</div>
                </div>

                <div style="margin:18px 0 0;padding:16px;border:1px solid #222222;background:#111111;">
                  <p style="margin:0 0 6px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">Useful links</p>
                  <p style="margin:0 0 6px;font-size:14px;">
                    <a href="${escapeHtml(prUrl)}" style="color:#ff6b00;text-decoration:none;">View PR</a>
                    &nbsp;&bull;&nbsp;
                    <a href="${escapeHtml(repositoryDashboardUrl)}" style="color:#ff6b00;text-decoration:none;">Project in feedback2code</a>
                  </p>
                  <p style="margin:0 0 6px;font-size:14px;">
                    <a href="${escapeHtml(dashboardUrl)}" style="color:#ff6b00;text-decoration:none;">Dashboard</a>
                    &nbsp;&bull;&nbsp;
                    <a href="${escapeHtml(githubRepoUrl)}" style="color:#ff6b00;text-decoration:none;">GitHub repo</a>
                  </p>
                  <p style="margin:0;font-size:14px;">
                    <a href="${escapeHtml(profileUrl)}" style="color:#ff6b00;text-decoration:none;">Profile</a>
                    &nbsp;&bull;&nbsp;
                    <a href="${escapeHtml(legalUrl)}" style="color:#ff6b00;text-decoration:none;">Legal & contact</a>
                  </p>
                </div>

                <p style="margin:18px 0 0;color:#a0a0a0;font-size:14px;">
                  Need help? Reply to this email and we can take a look together.
                </p>

                ${testModeNote ? `<p style="margin:18px 0 0;color:#888888;font-size:12px;">${escapeHtml(testModeNote)}</p>` : ""}
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

Your automated feedback PR is ready for review.

Repository: ${repositoryFullName}
Pull request: ${prUrl}

Original feedback:
${feedbackBody}

Useful links:
- Project in feedback2code: ${repositoryDashboardUrl}
- Dashboard: ${dashboardUrl}
- GitHub repo: ${githubRepoUrl}
- Profile: ${profileUrl}
- Legal & contact: ${legalUrl}

What to do next:
- Open the PR and review the diff.
- Merge it on GitHub if the change looks right.
- Close it if the output is not what you want.

Need help? Reply to this email.${testModeNote ? `\n\n${testModeNote}` : ""}`;

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
