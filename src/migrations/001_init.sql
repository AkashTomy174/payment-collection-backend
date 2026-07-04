CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  account_number VARCHAR(20) UNIQUE NOT NULL,
  issue_date DATE NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  tenure_months INT NOT NULL CHECK (tenure_months > 0),
  emi_due DECIMAL(10,2) NOT NULL CHECK (emi_due >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_reference VARCHAR(40) UNIQUE NOT NULL,
  payment_date TIMESTAMP DEFAULT NOW(),
  payment_amount DECIMAL(10,2) NOT NULL CHECK (payment_amount > 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_date ON payments(customer_id, payment_date DESC);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);
