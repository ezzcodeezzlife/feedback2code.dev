import { Resend } from "resend";

type SendPrCreatedEmailInput = {
  // Intended recipients (what we want to notify).
  intendedToEmails: string[];
  // Used only for message content / debugging (not necessarily the actual `to` in test mode).
  repositoryFullName: string;
  prUrl: string;
  // Optional personalization
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

export async function sendPrCreatedEmail(input: SendPrCreatedEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping PR-created email");
    return;
  }

  const mode = getEmailMode();

  const fromEmail = (process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev").trim();
  const fromName = (process.env.RESEND_FROM_NAME ?? "Feedback2Code").trim();
  const from = `${fromName} <${fromEmail}>`;

  // In Resend's "test mode", we still exercise the API safely by sending to Resend's
  // sandbox inbox on `resend.dev`, while embedding the intended recipients in the body.
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

  const recipientName = input.intendedRecipientName?.trim();

  const subject =
    mode === "test"
      ? process.env.RESEND_PR_CREATED_SUBJECT_TEST ?? "[test] PR-created notification"
      : process.env.RESEND_PR_CREATED_SUBJECT ?? "Your feedback PR is ready";
  const repositoryFullName = input.repositoryFullName;

  const html = `<!doctype html>
<html>
  <body>
    <p>Hi ${recipientName ? recipientName : "there"},</p>
    <p>Done. Your automated feedback PR has been created.</p>
    <p>
      <a href="${input.prUrl}" target="_blank" rel="noopener noreferrer">View the PR</a>
    </p>
    <p>Repository: ${repositoryFullName}</p>
    ${
      mode === "test"
        ? `<p><em>Test mode.</em> Intended recipient(s): ${intendedRecipientsLine}</p>`
        : ""
    }
  </body>
</html>`;

  const text = `Hi ${recipientName ? recipientName : "there"},\n\nDone. Your automated feedback PR has been created.\n\nView the PR: ${input.prUrl}\nRepository: ${repositoryFullName}${mode === "test" ? `\n\nTest mode. Intended recipient(s): ${intendedRecipientsLine}` : ""}\n`;

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

