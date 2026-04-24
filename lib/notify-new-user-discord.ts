type NotifyNewUserDiscordInput = {
  email: string;
  registeredAt: Date;
};

// Optional: set DISCORD_NEW_USER_WEBHOOK_URL to the full incoming webhook URL.
export async function notifyNewUserDiscord(
  input: NotifyNewUserDiscordInput,
): Promise<void> {
  const url = process.env.DISCORD_NEW_USER_WEBHOOK_URL?.trim();
  if (!url) return;

  const time = input.registeredAt.toISOString();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `**New user registered**\n• Email: \`${input.email}\`\n• Time (UTC): \`${time}\``,
        allowed_mentions: { parse: [] },
      }),
    });
    if (!res.ok) {
      console.error(
        "[notifyNewUserDiscord] Webhook request failed",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (err) {
    console.error("[notifyNewUserDiscord]", err);
  }
}
