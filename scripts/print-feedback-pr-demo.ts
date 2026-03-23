/**
 * Sample PR title/body for demos (e.g. external showcase PRs).
 *
 *   NEXT_PUBLIC_APP_URL=https://feedback2code.com npx tsx scripts/print-feedback-pr-demo.ts [outDir]
 *
 * If `outDir` is set, writes `pr-title.txt` and `pr-body.md` there.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildFeedbackPrBody,
  buildFeedbackPrTitle,
} from "@/lib/feedback-agent/feedback-pr-copy";

const base =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  process.env.APP_URL?.replace(/\/$/, "") ||
  "https://feedback2code.com";
process.env.NEXT_PUBLIC_APP_URL = base;
process.env.APP_URL = base;

const title = buildFeedbackPrTitle(
  "On mobile Safari the motion-permission banner covers the start button — can we move it below the fold?",
);

const body = buildFeedbackPrBody({
  feedbackBody: `On mobile Safari the motion-permission banner covers the start button — can we move it below the fold?

Otherwise the accelerometer demo feels great — nice work.`,
  pagePath: "/",
  pageUrl: "https://accelormeter-music.vercel.app/",
  owner: "ezzcodeezzlife",
  repo: "accelormeter-music",
});

const outDir = process.argv[2]?.trim();
if (outDir) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "pr-title.txt"), `${title}\n`, "utf8");
  writeFileSync(join(outDir, "pr-body.md"), `${body}\n`, "utf8");
  console.log("Wrote", join(outDir, "pr-title.txt"), "and pr-body.md");
} else {
  console.log(title);
  console.log("\n---\n");
  console.log(body);
}
