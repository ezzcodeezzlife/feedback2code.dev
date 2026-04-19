# Custom E2B template for the widget feedback agent.
# Build (uploads to your E2B team): npm run e2b:build-feedback-template
# Docs: https://e2b.dev/docs/template/examples/docker
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git gnupg sudo \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

# E2B's builder may already create `user`; only add the account if missing.
RUN if ! id -u user >/dev/null 2>&1; then useradd -m -s /bin/bash user; fi \
  && printf '%s\n' 'user ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/99-e2b-feedback-agent \
  && chmod 0440 /etc/sudoers.d/99-e2b-feedback-agent

RUN npm install -g opencode-ai

USER user
WORKDIR /home/user

RUN mkdir -p /home/user/.config/opencode
