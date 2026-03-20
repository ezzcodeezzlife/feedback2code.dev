#!/usr/bin/env bash
set -euo pipefail

GHJS=/home/user/e2b-github.mjs
REPO_PATH=/home/user/feedback-repo
BASE="$(cat /home/user/f2c-base-branch.txt)"
BRANCH="${F2C_BRANCH}"

TOKEN="$(node "$GHJS" token)"
AUTH_URL="https://x-access-token:${TOKEN}@github.com/${F2C_OWNER}/${F2C_REPO}.git"
CLEAN_URL="https://github.com/${F2C_OWNER}/${F2C_REPO}.git"

git -C "$REPO_PATH" remote set-url origin "$AUTH_URL"
git -C "$REPO_PATH" fetch origin "$BASE" 2>/dev/null || true
AHEAD="$(git -C "$REPO_PATH" rev-list --count "origin/${BASE}"..HEAD 2>/dev/null || echo 0)"
git -C "$REPO_PATH" remote set-url origin "$CLEAN_URL"
unset TOKEN

if ! [[ "$AHEAD" =~ ^[0-9]+$ ]] || [ "$AHEAD" -lt 1 ]; then
  echo "NO_COMMITS"
  exit 2
fi

if [ -n "$(git -C "$REPO_PATH" status --porcelain)" ]; then
  git -C "$REPO_PATH" add -A
  git -C "$REPO_PATH" \
    -c user.email="feedback2code-bot@users.noreply.github.com" \
    -c user.name="feedback2code bot" \
    commit -m "chore: address widget feedback"
fi

TOKEN="$(node "$GHJS" token)"
PUSH_URL="https://x-access-token:${TOKEN}@github.com/${F2C_OWNER}/${F2C_REPO}.git"
git -C "$REPO_PATH" remote set-url origin "$PUSH_URL"
# Absorb all push output: "set up to track" and GitHub hints go to stdout/stderr and must not mix with PR URL below.
if ! git -C "$REPO_PATH" push -q -u origin "$BRANCH" >/tmp/f2c_git_push.out 2>/tmp/f2c_git_push.err; then
  cat /tmp/f2c_git_push.err /tmp/f2c_git_push.out >&2
  exit 1
fi
git -C "$REPO_PATH" remote set-url origin "$CLEAN_URL"
unset TOKEN

export F2C_PR_HEAD="$BRANCH"
export F2C_PR_BASE="$BASE"
# REST API can 422 briefly right after push until the new ref is visible.
sleep 2
# Only this line may write to script stdout (single PR URL) so the host can detect success reliably.
node "$GHJS" create-pr /home/user/f2c-pr-title.txt /home/user/f2c-pr-body.txt > /tmp/f2c_pr_url.txt
PR_URL="$(tr -d '\r\n' </tmp/f2c_pr_url.txt)"
if ! [[ "$PR_URL" =~ ^https://github\.com/[^/]+/[^/]+/pull/[0-9]+$ ]]; then
  echo "create-pr did not return a PR URL (got: ${PR_URL:0:200})" >&2
  cat /tmp/f2c_pr_url.txt >&2
  exit 1
fi
# Webhook handler reads this file to update the DB.
printf '%s' "$PR_URL" > /home/user/f2c-pr-url.txt
# Only the PR URL may write to stdout so the sandbox logs stay clean.
printf '%s' "$PR_URL"

# Push result to our app immediately (avoids relying on E2B lifecycle timing).
# These env vars are optional; the callback is best-effort.
if [ -n "${F2C_WEBHOOK_URL:-}" ] && [ -n "${F2C_WEBHOOK_SECRET:-}" ] && [ -n "${F2C_FEEDBACK_ID:-}" ]; then
  # If the app URL is behind Cloudflare/Tunnel, it may require full https URL.
  curl -fsS \
    -X POST "$F2C_WEBHOOK_URL" \
    -H "Authorization: Bearer ${F2C_WEBHOOK_SECRET}" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"f2c.feedback.completed\",\"feedbackId\":\"${F2C_FEEDBACK_ID}\",\"sandboxId\":\"${F2C_SANDBOX_ID:-}\",\"prUrl\":\"${PR_URL}\"}" \
    >/dev/null 2>&1 || { echo "[f2c] webhook callback failed" >&2; true; }
fi
