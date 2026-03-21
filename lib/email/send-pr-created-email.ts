import { Resend } from "resend";

type SendPrCreatedEmailInput = {
  intendedToEmails: string[];
  repositoryFullName: string;
  prUrl: string;
  feedbackBody?: string | null;
  intendedRecipientName?: string | null;
};

function getEmailMode(): "test" | "production" {
  const raw = process.env.RESEND_EMAIL_MODE ?? "production";
  const normalized = raw.trim().toLowerCase();
  return normalized === "test" ? "test" : "production";
}

function uniqueNonEmptyEmails(emails: string[]): string[] {
  const set = new Set<string>();
  for (const e of emails) {
    const v = e.trim();
    if (v) set.add(v);
  }
  return Array.from(set);
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

function buildPrCreatedEmailHtml(options: {
  recipientName: string;
  repositoryFullName: string;
  prUrl: string;
  feedbackBody?: string | null;
  dashboardUrl: string;
  repositoryDashboardUrl: string;
  githubRepoUrl: string;
  profileUrl: string;
  legalUrl: string;
  testModeNote?: string;
}): string {
  const {
    recipientName,
    repositoryFullName,
    prUrl,
    feedbackBody,
    dashboardUrl,
    repositoryDashboardUrl,
    githubRepoUrl,
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
                <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#ff6b00;">[ pr ready ]</div>
                <h1 style="margin:12px 0 6px;font-size:24px;font-weight:700;color:#ededed;">Your feedback PR is ready</h1>
                <p style="margin:0;font-size:14px;color:#a0a0a0;">A new automated change is waiting for review.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi ${recipientName},</p>
                <p style="margin:0 0 16px;color:#a0a0a0;">
                  feedback2code finished turning the latest submission into a GitHub pull request for <strong style="color:#ededed;">${repositoryFullName}</strong>.
                </p>

                <div style="margin:18px 0 8px;">
                  <a href="${prUrl}" style="display:inline-block;background:#ff6b00;color:#000000;text-decoration:none;padding:12px 18px;border:1px solid #ff6b00;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;font-size:12px;">
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
                      <p style="margin:8px 0 0;color:#ededed;font-size:14px;word-break:break-word;">${prUrl}</p>
                    </div>
                    <div style="padding:12px 14px;">
                      <p style="margin:0;color:#a0a0a0;font-size:13px;line-height:1.6;">Repository: ${repositoryFullName}</p>
                    </div>
                  </div>
                </div>

                ${
                  feedbackBody
                    ? `<div style="margin:18px 0 0;padding:16px;border:1px solid #222222;background:#111111;">
                  <p style="margin:0 0 10px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">Original feedback</p>
                  <div style="border:1px solid #222222;background:#0a0a0a;padding:14px;color:#ededed;font-size:14px;line-height:1.7;white-space:pre-wrap;">${feedbackBody}</div>
                </div>`
                    : ""
                }

                <div style="margin:18px 0 0;padding:16px;border:1px solid #222222;background:#111111;">
                  <p style="margin:0 0 6px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">Useful links</p>
                  <p style="margin:0 0 6px;font-size:14px;">
                    <a href="${prUrl}" style="color:#ff6b00;text-decoration:none;">View PR</a>
                    &nbsp;&bull;&nbsp;
                    <a href="${repositoryDashboardUrl}" style="color:#ff6b00;text-decoration:none;">Project in feedback2code</a>
                  </p>
                  <p style="margin:0 0 6px;font-size:14px;">
                    <a href="${dashboardUrl}" style="color:#ff6b00;text-decoration:none;">Dashboard</a>
                    &nbsp;&bull;&nbsp;
                    <a href="${githubRepoUrl}" style="color:#ff6b00;text-decoration:none;">GitHub repo</a>
                  </p>
                  <p style="margin:0;font-size:14px;">
                    <a href="${profileUrl}" style="color:#ff6b00;text-decoration:none;">Profile</a>
                    &nbsp;&bull;&nbsp;
                    <a href="${legalUrl}" style="color:#ff6b00;text-decoration:none;">Legal & contact</a>
                  </p>
                </div>

                <p style="margin:18px 0 0;color:#a0a0a0;font-size:14px;">
                  Need help? Reply to this email and we can take a look together.
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

function buildPrCreatedEmailText(options: {
  recipientName: string;
  repositoryFullName: string;
  prUrl: string;
  feedbackBody?: string | null;
  dashboardUrl: string;
  repositoryDashboardUrl: string;
  githubRepoUrl: string;
  profileUrl: string;
  legalUrl: string;
  testModeNote?: string;
}): string {
  const {
    recipientName,
    repositoryFullName,
    prUrl,
    feedbackBody,
    dashboardUrl,
    repositoryDashboardUrl,
    githubRepoUrl,
    profileUrl,
    legalUrl,
    testModeNote,
  } = options;

  return `Hi ${recipientName},

Your automated feedback PR is ready for review.

Repository: ${repositoryFullName}
Pull request: ${prUrl}

${feedbackBody ? `Original feedback:\n${feedbackBody}\n` : ""}

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
}

export async function sendPrCreatedEmail(input: SendPrCreatedEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping PR-created email");
    return;
  }

  const mode = getEmailMode();

  const fromEmail = (process.env.RESEND_FROM_EMAIL ?? "notifications@feedback2code.dev").trim();
  const fromName = (process.env.RESEND_FROM_NAME ?? "Feedback2Code").trim();
  const from = `${fromName} <${fromEmail}>`;

  const testTo = (process.env.RESEND_TEST_TO ?? "delivered@resend.dev").trim();
  const intendedToEmails = uniqueNonEmptyEmails(input.intendedToEmails);
  const to = mode === "test" ? [testTo] : intendedToEmails;

  if (to.length === 0) {
    console.warn("[email] No recipient emails; skipping PR-created email");
    return;
  }

  const intendedRecipientsLine =
    mode === "test"
      ? intendedToEmails.length > 0
        ? intendedToEmails.join(", ")
        : "(none)"
      : "";

  const recipientName = input.intendedRecipientName?.trim() || "there";
  const safeRecipientName = escapeHtml(recipientName);
  const repositoryFullName = input.repositoryFullName.trim();
  const [owner = "", repo = ""] = repositoryFullName.split("/");
  const baseUrl = resolveBaseUrl();
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

  const testModeNote =
    mode === "test" ? `Test mode. Intended recipient(s): ${intendedRecipientsLine}` : undefined;

  const html = buildPrCreatedEmailHtml({
    recipientName: safeRecipientName,
    repositoryFullName: escapeHtml(repositoryFullName),
    prUrl: escapeHtml(input.prUrl),
    feedbackBody: input.feedbackBody ? escapeHtml(input.feedbackBody.trim()) : undefined,
    dashboardUrl,
    repositoryDashboardUrl,
    githubRepoUrl,
    profileUrl,
    legalUrl,
    testModeNote,
  });

  const text = buildPrCreatedEmailText({
    recipientName,
    repositoryFullName,
    prUrl: input.prUrl,
    feedbackBody: input.feedbackBody?.trim(),
    dashboardUrl,
    repositoryDashboardUrl,
    githubRepoUrl,
    profileUrl,
    legalUrl,
    testModeNote,
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
    console.log("[email] PR-created email sent", {
      mode,
      to,
      prUrl: input.prUrl,
      resendId:
        (() => {
          const r = result as unknown as { id?: unknown };
          return typeof r.id === "string" ? r.id : null;
        })(),
    });
  } catch (e) {
    console.error("[email] Failed to send PR-created email", {
      mode,
      to,
      prUrl: input.prUrl,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
