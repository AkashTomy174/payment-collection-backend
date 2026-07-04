#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/payment-backend}"
REPO_URL="${REPO_URL:?REPO_URL is required}"
BRANCH="${BRANCH:-main}"

if [ ! -d "$APP_DIR/.git" ]; then
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER":"$USER" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

npm ci
npm run build

if [ -f .env ]; then
  npm run migrate
  npm run seed
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
  pm2 save
else
  echo "pm2 is not installed. Install it with: sudo npm install -g pm2"
  exit 1
fi

