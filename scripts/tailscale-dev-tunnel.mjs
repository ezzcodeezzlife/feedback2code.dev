#!/usr/bin/env node
/**
 * Start Tailscale Serve or Funnel pointing at the local Next dev server.
 *
 * The HTTPS hostname is stable (this machine + tailnet) across restarts.
 *
 * One-time admin:
 *   - Serve: https://login.tailscale.com/f/serve?node=... (link printed if disabled)
 *   - Funnel: https://login.tailscale.com/f/funnel?node=... (--funnel)
 *
 * Set once in .env.development (no trailing slash):
 *   NEXTAUTH_URL=https://<host>.ts.net
 *   NEXT_PUBLIC_APP_URL=https://<host>.ts.net
 *
 * GitHub OAuth app callback:
 *   https://<host>.ts.net/api/auth/callback/github
 *
 * Serve = tailnet only (browser must use MagicDNS / Tailscale). Funnel = public (webhooks work).
 */
import { execFileSync, spawnSync } from "node:child_process";

function usage() {
  console.log(`Usage: node scripts/tailscale-dev-tunnel.mjs [options]

Options:
  --funnel     Use Tailscale Funnel (internet) instead of Serve (tailnet only).
  --reset      Clear existing serve/funnel config for this mode before starting.
  --port <n>   Local port (default: TAILSCALE_TUNNEL_PORT, PORT, or 3000).
  --help       Show this message.

Examples:
  npm run tunnel:tailscale
  npm run tunnel:tailscale:funnel
`);
}

function parseArgs(argv) {
  let funnel = false;
  let reset = false;
  let port =
    process.env.TAILSCALE_TUNNEL_PORT ?? process.env.PORT ?? "3000";
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      usage();
      process.exit(0);
    }
    if (a === "--funnel") {
      funnel = true;
      continue;
    }
    if (a === "--reset") {
      reset = true;
      continue;
    }
    if (a === "--port") {
      port = argv[++i] ?? port;
      continue;
    }
    console.error(`Unknown argument: ${a}`);
    usage();
    process.exit(1);
  }
  return { funnel, reset, port };
}

function originFromStatusJson(json) {
  const web = json?.Web;
  if (!web || typeof web !== "object") return null;
  const keys = Object.keys(web);
  const k = keys.find((x) => x.endsWith(":443")) ?? keys[0];
  if (!k) return null;
  const host = k.replace(/:443$/, "");
  return `https://${host}`;
}

function main() {
  const { funnel, reset, port } = parseArgs(process.argv);
  const cmd = funnel ? "funnel" : "serve";
  const target = `http://127.0.0.1:${port}`;

  if (reset) {
    const r0 = spawnSync("tailscale", [cmd, "reset"], {
      encoding: "utf8",
      stdio: "inherit",
    });
    if (r0.status !== 0) process.exit(r0.status ?? 1);
  }

  const run = spawnSync("tailscale", [cmd, "--bg", target], {
    encoding: "utf8",
    stdio: "pipe",
  });
  const out = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  console.log(out);
  if (run.status !== 0) {
    if (/not enabled on your tailnet/i.test(out)) {
      console.error(
        `\nEnable ${cmd} for this node in the Tailscale admin console (link above), then run this script again.`,
      );
    }
    process.exit(run.status ?? 1);
  }

  let origin;
  try {
    const raw = execFileSync("tailscale", [cmd, "status", "--json"], {
      encoding: "utf8",
    });
    origin = originFromStatusJson(JSON.parse(raw));
  } catch {
    origin = null;
  }

  if (!origin) {
    console.warn(
      "Could not parse tunnel URL from `tailscale %s status --json`. Check `tailscale %s status`.",
      cmd,
      cmd,
    );
    process.exit(0);
  }

  console.log(`
Stable origin (use in .env.development — set once):
  NEXTAUTH_URL=${origin}
  NEXT_PUBLIC_APP_URL=${origin}

Next.js dev: allowedDevOrigins picks up the hostname from NEXTAUTH_URL automatically.

GitHub OAuth callback URL:
  ${origin}/api/auth/callback/github
`);
}

main();
