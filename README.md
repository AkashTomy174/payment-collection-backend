# Payment Collection Backend

Node.js/Express API for loan lookup, EMI payment recording, and payment history.

## Setup

```bash
npm install
cp .env.example .env
```

Update `.env` with your Postgres connection string:

```bash
DATABASE_URL=postgres://payment_app:change_me@localhost:5432/payment_collection
JWT_SECRET=replace_with_a_long_random_secret
```

If Postgres is not installed yet, set `USE_MEMORY_DB=true` for a local demo run. Use Postgres for the actual submitted deployment.

Create the database, then run:

```bash
npm run migrate
npm run seed
npm run dev
```

## API

Health check:

```bash
GET /health
```

List customers:

```bash
GET /customers?page=1&limit=20&sort=account_number&order=asc
```

Get one customer:

```bash
GET /customers/AC10293847
```

Create payment:

```bash
POST /payments
Content-Type: application/json

{
  "accountNumber": "AC10293847",
  "amount": 14250
}
```

Payment history:

```bash
GET /payments/AC10293847?page=1&limit=10&sort=payment_date&order=desc
```

## Deployment Notes

Build and run on EC2:

```bash
npm ci
npm run build
pm2 start ecosystem.config.cjs --env production
pm2 save
```

Place production environment variables in `/var/www/payment-backend/.env`, not in git.

Nginx should reverse proxy `https://api.yourdomain.com` to `localhost:3000`.
