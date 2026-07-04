#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/payment-backend}"
REPO_URL="${REPO_URL:?REPO_URL is required}"
BRANCH="${BRANCH:-main}"
PORT="${PORT:-3000}"

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
  set -a
  . ./.env
  set +a
  npm run migrate
  npm run seed
fi

npm prune --omit=dev

if command -v pm2 >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --env production --update-env || pm2 start ecosystem.config.cjs --env production
  pm2 save
else
  echo "pm2 is not installed. Install it with: sudo npm install -g pm2"
  exit 1
fi

for attempt in 1 2 3 4 5; do
  if curl --fail --silent --show-error "http://127.0.0.1:$PORT/health"; then
    exit 0
  fi
  sleep 2
done
exit 1
