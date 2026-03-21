import { Resend } from "resend";

type SendPrCreatedEmailInput = {
  intendedToEmails: string[];
  repositoryFullName: string;
  prUrl: string;
  feedbackBody?: string | null;
  /** Widget `location.pathname` where feedback was sent from, e.g. `/blog/post`. */
  pagePath?: string | null;
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

function buildPrCreatedEmailHtml(options: {
  recipientName: string;
  repositoryFullName: string;
  prUrl: string;
  feedbackBody?: string | null;
  pagePath?: string | null;
  testModeNote?: string;
}): string {
  const { recipientName, repositoryFullName, prUrl, feedbackBody, pagePath, testModeNote } = options;

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

                ${
                  pagePath && !feedbackBody
                    ? `<p style="margin:0 0 16px;">
                  <span style="display:inline-block;vertical-align:middle;max-width:100%;font-family:'Fira Code','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:1.35;color:#9ca3af;border:1px solid #2a2a2a;padding:3px 6px;word-break:break-all;" title="${pagePath}">${pagePath}</span>
                </p>`
                    : ""
                }

                ${
                  feedbackBody
                    ? `<div style="margin:0 0 18px;padding:16px;border:1px solid #222222;background:#111111;">
                  ${
                    pagePath
                      ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 10px;border-collapse:collapse;">
                    <tr>
                      <td align="left" valign="middle" style="padding:0 10px 0 0;">
                        <span style="display:inline-block;vertical-align:middle;margin:0;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;line-height:1;">User feedback</span>
                      </td>
                      <td align="right" valign="middle" style="padding:0;">
                        <span style="display:inline-block;vertical-align:middle;text-align:right;max-width:100%;font-family:'Fira Code','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:1.2;color:#9ca3af;border:1px solid #2a2a2a;padding:3px 6px;word-break:break-all;box-sizing:border-box;" title="${pagePath}">${pagePath}</span>
                      </td>
                    </tr>
                  </table>`
                      : `<p style="margin:0 0 10px;color:#a0a0a0;font-size:13px;text-transform:uppercase;letter-spacing:0.16em;">User feedback</p>`
                  }
                  <div style="border:1px solid #222222;background:#0a0a0a;padding:14px;color:#ededed;font-size:14px;line-height:1.7;white-space:pre-wrap;">${feedbackBody}</div>
                </div>`
                    : ""
                }

                <div style="margin:0 0 8px;">
                  <a href="${prUrl}" style="display:inline-block;background:#ff6b00;color:#000000;text-decoration:none;padding:12px 18px;border:1px solid #ff6b00;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;font-size:12px;">
                    Review pull request
                  </a>
                </div>

                <p style="margin:18px 0 0;color:#a0a0a0;font-size:14px;">
                  Need help? Reply to this email and we can take a look together.
                </p>

                ${
                  testModeNote
                    ? `<p style="margin:18px 0 0;color:#888888;font-size:12px;">${escapeHtml(testModeNote)}</p>`
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
  pagePath?: string | null;
  testModeNote?: string;
}): string {
  const { recipientName, repositoryFullName, prUrl, feedbackBody, pagePath, testModeNote } = options;

  return `Hi ${recipientName},

Your automated feedback PR is ready for review.

Repository: ${repositoryFullName}
${pagePath ? `\nFrom ${pagePath}\n` : ""}${feedbackBody ? `\nUser feedback:\n${feedbackBody}\n` : ""}
Review the pull request: ${prUrl}

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
  const pagePathTrimmed = input.pagePath?.trim() ?? "";
  const safePagePath = pagePathTrimmed ? escapeHtml(pagePathTrimmed) : undefined;

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
    pagePath: safePagePath,
    testModeNote,
  });

  const text = buildPrCreatedEmailText({
    recipientName,
    repositoryFullName,
    prUrl: input.prUrl,
    feedbackBody: input.feedbackBody?.trim(),
    pagePath: pagePathTrimmed || undefined,
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
