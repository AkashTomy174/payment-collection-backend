import { db } from "../config/db.js";
import { buildPagination, buildPaginationMeta } from "../utils/pagination.js";
import type { Request } from "express";

export async function listCustomers(query: Request["query"]) {
  const pagination = buildPagination(query, ["account_number", "issue_date", "emi_due", "id"]);
  const customers = await db.query(
    `SELECT c.id,
            c.account_number,
            c.issue_date,
            c.interest_rate,
            c.tenure_months,
            c.emi_due,
            COALESCE(p.successful_payments, 0)::int AS paid_installments,
            GREATEST(c.tenure_months - COALESCE(p.successful_payments, 0), 0)::int AS payments_left,
            (GREATEST(c.tenure_months - COALESCE(p.successful_payments, 0), 0) * c.emi_due)::numeric(12, 2) AS total_amount_to_be_paid
     FROM customers c
     LEFT JOIN (
       SELECT customer_id, COUNT(*)::int AS successful_payments
       FROM payments
       WHERE status = 'SUCCESS'
       GROUP BY customer_id
     ) p ON p.customer_id = c.id
     ORDER BY c.${pagination.sort} ${pagination.order}
     LIMIT $1 OFFSET $2`,
    [pagination.limit, pagination.offset]
  );
  const count = await db.query<{ count: number }>("SELECT COUNT(*)::int AS count FROM customers");

  return {
    data: customers.rows,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, count.rows[0].count),
  };
}

export async function findCustomerByAccount(accountNumber: string) {
  const result = await db.query(
    `SELECT c.id,
            c.account_number,
            c.issue_date,
            c.interest_rate,
            c.tenure_months,
            c.emi_due,
            COALESCE(p.successful_payments, 0)::int AS paid_installments,
            GREATEST(c.tenure_months - COALESCE(p.successful_payments, 0), 0)::int AS payments_left,
            (GREATEST(c.tenure_months - COALESCE(p.successful_payments, 0), 0) * c.emi_due)::numeric(12, 2) AS total_amount_to_be_paid
     FROM customers c
     LEFT JOIN (
       SELECT customer_id, COUNT(*)::int AS successful_payments
       FROM payments
       WHERE status = 'SUCCESS'
       GROUP BY customer_id
     ) p ON p.customer_id = c.id
     WHERE c.account_number = $1`,
    [accountNumber]
  );

  return result.rows[0] ?? null;
}
