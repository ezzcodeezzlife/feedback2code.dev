import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.production");

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const result = fs.existsSync(envFile)
  ? spawnSync(npx, ["dotenv", "-e", ".env.production", "--", "prisma", "migrate", "deploy"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    })
  : spawnSync(npx, ["prisma", "migrate", "deploy"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });

process.exit(result.status ?? 1);
