import pg from "pg";

const { Pool } = pg;

type QueryResult<T> = { rows: T[] };
type Queryable = {
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<QueryResult<T>>;
};

type MemoryCustomer = {
  id: number;
  account_number: string;
  issue_date: string;
  interest_rate: string;
  tenure_months: number;
  emi_due: string;
};

type MemoryCustomerWithSummary = MemoryCustomer & {
  paid_installments: number;
  payments_left: number;
  total_amount_to_be_paid: string;
};

type MemoryPayment = {
  id: number;
  customer_id: number;
  transaction_reference: string;
  payment_date: string;
  payment_amount: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
};

type MemoryUser = {
  id: number;
  customer_id: number | null;
  name: string;
  email: string;
  password_hash: string;
  role: "customer" | "admin";
  created_at: string;
};

const customers: MemoryCustomer[] = [
  {
    id: 1,
    account_number: "AC10293847",
    issue_date: "2025-01-12",
    interest_rate: "11.50",
    tenure_months: 24,
    emi_due: "14250.00",
  },
  {
    id: 2,
    account_number: "AC20485611",
    issue_date: "2025-03-04",
    interest_rate: "10.75",
    tenure_months: 36,
    emi_due: "9800.00",
  },
  {
    id: 3,
    account_number: "AC30991245",
    issue_date: "2024-11-20",
    interest_rate: "12.25",
    tenure_months: 18,
    emi_due: "16440.00",
  },
];

const payments: MemoryPayment[] = [
  {
    id: 1,
    customer_id: 1,
    transaction_reference: "TXN-SEED-AC10293847-01",
    payment_date: "2026-06-04T10:30:00.000Z",
    payment_amount: "14250.00",
    status: "SUCCESS",
  },
];

const users: MemoryUser[] = [
  {
    id: 1,
    customer_id: 1,
    name: "Demo Customer",
    email: "demo@example.com",
    password_hash: "$2a$10$RKZhCGtSxFGq3Nc9gHgQ8OraG9DGvtD.6rm6pDtDXj2nkCpJETBrq",
    role: "customer",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    customer_id: null,
    name: "Admin User",
    email: "admin@example.com",
    password_hash: "$2a$10$RKZhCGtSxFGq3Nc9gHgQ8OraG9DGvtD.6rm6pDtDXj2nkCpJETBrq",
    role: "admin",
    created_at: new Date().toISOString(),
  },
];

function withLoanSummary(customer: MemoryCustomer): MemoryCustomerWithSummary {
  const paidInstallments = payments.filter((payment) => payment.customer_id === customer.id && payment.status === "SUCCESS").length;
  const paymentsLeft = Math.max(customer.tenure_months - paidInstallments, 0);

  return {
    ...customer,
    paid_installments: paidInstallments,
    payments_left: paymentsLeft,
    total_amount_to_be_paid: (paymentsLeft * Number(customer.emi_due)).toFixed(2),
  };
}

function sortRows<T extends Record<string, unknown>>(rows: T[], sql: string) {
  const sortMatch = sql.match(/ORDER BY\s+(?:[a-z_]+\.)?([a-z_]+)\s+(ASC|DESC)/i);
  if (!sortMatch) return rows;
  const [, key, direction] = sortMatch;

  return [...rows].sort((left, right) => {
    const a = String(left[key]);
    const b = String(right[key]);
    return direction.toUpperCase() === "DESC" ? b.localeCompare(a) : a.localeCompare(b);
  });
}

function paginateRows<T>(rows: T[], params: unknown[]) {
  const limit = Number(params.at(-2) ?? rows.length);
  const offset = Number(params.at(-1) ?? 0);
  return rows.slice(offset, offset + limit);
}

function createMemoryDb(): Queryable {
  return {
    async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
      const normalized = sql.replace(/\s+/g, " ").trim();

      if (normalized === "SELECT 1") {
        return { rows: [{ "?column?": 1 }] as T[] };
      }

      if (normalized.startsWith("SELECT COUNT(*)::int AS count FROM customers")) {
        return { rows: [{ count: customers.length }] as T[] };
      }

      if (normalized.includes("FROM customers") && normalized.includes("account_number = $1")) {
        const rows = customers.filter((customer) => customer.account_number === params[0]).map(withLoanSummary);
        return { rows: rows as T[] };
      }

      if (normalized.includes("FROM customers")) {
        const rows = paginateRows(sortRows(customers.map(withLoanSummary), normalized), params);
        return { rows: rows as T[] };
      }

      if (normalized.startsWith("INSERT INTO payments")) {
        const payment: MemoryPayment = {
          id: payments.length + 1,
          customer_id: Number(params[0]),
          transaction_reference: String(params[1]),
          payment_date: new Date().toISOString(),
          payment_amount: Number(params[2]).toFixed(2),
          status: "SUCCESS",
        };
        payments.push(payment);
        return { rows: [payment] as T[] };
      }

      if (normalized.startsWith("SELECT COUNT(*)::int AS count FROM payments")) {
        const customerId = Number(params[0]);
        return { rows: [{ count: payments.filter((payment) => payment.customer_id === customerId).length }] as T[] };
      }

      if (normalized.includes("FROM payments") && normalized.includes("WHERE customer_id = $1")) {
        const customerId = Number(params[0]);
        const rows = paginateRows(
          sortRows(
            payments.filter((payment) => payment.customer_id === customerId),
            normalized
          ),
          params
        );
        return { rows: rows as T[] };
      }

      if (normalized.startsWith("SELECT id FROM users WHERE email = $1")) {
        return { rows: users.filter((user) => user.email === params[0]).map((user) => ({ id: user.id })) as T[] };
      }

      if (normalized.startsWith("INSERT INTO users")) {
        const user: MemoryUser = {
          id: users.length + 1,
          customer_id: Number(params[0]),
          name: String(params[1]),
          email: String(params[2]),
          password_hash: String(params[3]),
          role: "customer",
          created_at: new Date().toISOString(),
        };
        users.push(user);
        return {
          rows: [
            {
              ...user,
              account_number: String(params[4]),
            },
          ] as T[],
        };
      }

      if (normalized.includes("FROM users u") && normalized.includes("WHERE u.email = $1")) {
        const rows = users
          .filter((user) => user.email === params[0])
          .map((user) => {
            const customer = customers.find((candidate) => candidate.id === user.customer_id);
            return {
              ...user,
              account_number: customer?.account_number ?? "",
            };
          });
        return { rows: rows as T[] };
      }

      throw new Error(`Unsupported in-memory query: ${normalized}`);
    },
  };
}

export const db: Queryable = process.env.USE_MEMORY_DB === "true" ? createMemoryDb() : new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function assertDbConnection() {
  await db.query("SELECT 1");
}
