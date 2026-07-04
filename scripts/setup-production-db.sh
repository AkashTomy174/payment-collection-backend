#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/payment-backend}"
ENV_FILE="$APP_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required in $ENV_FILE"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to parse DATABASE_URL"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib postgresql-client
fi

sudo systemctl enable --now postgresql

DB_USER="$(node -e 'const url = new URL(process.env.DATABASE_URL); console.log(decodeURIComponent(url.username));')"
DB_PASSWORD="$(node -e 'const url = new URL(process.env.DATABASE_URL); console.log(decodeURIComponent(url.password));')"
DB_NAME="$(node -e 'const url = new URL(process.env.DATABASE_URL); const path = url.pathname; console.log(path.startsWith("/") ? path.slice(1) : path);')"

if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
  echo "DATABASE_URL must include user, password, and database name"
  exit 1
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 \
  -v db_user="$DB_USER" \
  -v db_password="$DB_PASSWORD" \
  -v db_name="$DB_NAME" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = :'db_user')\gexec

SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = :'db_user')\gexec

SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db_name')\gexec

SELECT format('GRANT ALL PRIVILEGES ON DATABASE %I TO %I', :'db_name', :'db_user')\gexec
SQL

cd "$APP_DIR"
npm run migrate
npm run seed

if command -v pm2 >/dev/null 2>&1; then
  pm2 reload payment-backend --update-env || pm2 start ecosystem.config.cjs --env production
  pm2 save
fi

echo "Production database is ready."
