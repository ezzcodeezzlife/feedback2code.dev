/**
 * Server-side Turnstile verification (https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
 * Omits `remoteip` on siteverify: Cloudflare discourages it unless necessary; proxy/Tailscale
 * client IPs often mismatch and cause false failures.
 */
export async function verifyTurnstileToken(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: false, error: "not_configured" };
  }
  if (!token || typeof token !== "string" || token.length > 2048) {
    return { ok: false, error: "missing_token" };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as {
    success?: boolean;
    "error-codes"?: string[];
  };

  if (data.success) {
    return { ok: true };
  }
  const codes = data["error-codes"]?.join(",") ?? "verify_failed";
  return { ok: false, error: codes };
}
