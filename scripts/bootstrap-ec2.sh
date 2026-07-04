#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/payment-backend}"
APP_USER="${APP_USER:-ubuntu}"
DB_NAME="${DB_NAME:-payment_collection}"
DB_USER="${DB_USER:-payment_app}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD is required}"
API_SERVER_NAME="${API_SERVER_NAME:-loan-api.akashtomy.com}"
PORT="${PORT:-3000}"

sudo apt-get update
sudo apt-get install -y ca-certificates curl git nginx postgresql postgresql-contrib postgresql-client

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

sudo systemctl enable --now postgresql
sudo systemctl enable --now nginx

sudo -u postgres psql <<SQL
DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

sudo mkdir -p "$APP_DIR"
sudo chown "$APP_USER":"$APP_USER" "$APP_DIR"

sudo tee /etc/nginx/sites-available/payment-backend >/dev/null <<NGINX
server {
  listen 80;
  server_name ${API_SERVER_NAME};

  location / {
    proxy_pass http://127.0.0.1:${PORT};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/payment-backend /etc/nginx/sites-enabled/payment-backend
sudo nginx -t
sudo systemctl reload nginx

echo "EC2 bootstrap complete."
