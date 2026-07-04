INSERT INTO customers (account_number, issue_date, interest_rate, tenure_months, emi_due)
VALUES
  ('AC10293847', '2025-01-12', 11.50, 24, 14250.00),
  ('AC20485611', '2025-03-04', 10.75, 36, 9800.00),
  ('AC30991245', '2024-11-20', 12.25, 18, 16440.00)
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO payments (customer_id, transaction_reference, payment_date, payment_amount, status)
SELECT id, 'TXN-SEED-AC10293847-01', '2026-06-04 10:30:00', 14250.00, 'SUCCESS'
FROM customers WHERE account_number = 'AC10293847'
ON CONFLICT (transaction_reference) DO NOTHING;

INSERT INTO users (customer_id, name, email, password_hash)
SELECT id, 'Demo Customer', 'demo@example.com', '$2a$10$RKZhCGtSxFGq3Nc9gHgQ8OraG9DGvtD.6rm6pDtDXj2nkCpJETBrq'
FROM customers WHERE account_number = 'AC10293847'
ON CONFLICT (email) DO NOTHING;
