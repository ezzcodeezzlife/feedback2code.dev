#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

GHJS=/home/user/e2b-github.mjs
REPO_PATH=/home/user/feedback-repo

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

TOKEN="$(node "$GHJS" token)"
BASE="$(node "$GHJS" default-branch)"
printf '%s' "$BASE" > /home/user/f2c-base-branch.txt

git clone --depth 1 -b "$BASE" \
  "https://x-access-token:${TOKEN}@github.com/${F2C_OWNER}/${F2C_REPO}.git" \
  "$REPO_PATH"
git -C "$REPO_PATH" remote set-url origin "https://github.com/${F2C_OWNER}/${F2C_REPO}.git"
unset TOKEN

git -C "$REPO_PATH" config user.email "feedback2code-bot@users.noreply.github.com"
git -C "$REPO_PATH" config user.name "feedback2code bot"
git -C "$REPO_PATH" checkout -b "${F2C_BRANCH}"

sudo npm install -g opencode-ai
mkdir -p /home/user/.config/opencode
