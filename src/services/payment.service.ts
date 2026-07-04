import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";
import { buildPagination, buildPaginationMeta } from "../utils/pagination.js";
import { findCustomerByAccount } from "./customer.service.js";
import type { Request } from "express";

export async function createPayment(accountNumber: string, amount: number) {
  const customer = await findCustomerByAccount(accountNumber);
  if (!customer) {
    return { statusCode: 404, body: { success: false, message: "Customer account not found" } };
  }

  const result = await db.query(
    `INSERT INTO payments (customer_id, transaction_reference, payment_amount, status)
     VALUES ($1, $2, $3, 'SUCCESS')
     RETURNING id, customer_id, transaction_reference, payment_date, payment_amount, status`,
    [customer.id, `TXN-${randomUUID().slice(0, 18).toUpperCase()}`, amount]
  );

  return {
    statusCode: 201,
    body: {
      success: true,
      message: "Payment recorded successfully",
      data: result.rows[0],
    },
  };
}

export async function listPaymentsByAccount(accountNumber: string, query: Request["query"]) {
  const customer = await findCustomerByAccount(accountNumber);
  if (!customer) {
    return { statusCode: 404, body: { success: false, message: "Customer account not found" } };
  }

  const pagination = buildPagination(query, ["payment_date", "payment_amount", "status", "id"]);
  const payments = await db.query(
    `SELECT id, customer_id, transaction_reference, payment_date, payment_amount, status
     FROM payments
     WHERE customer_id = $1
     ORDER BY ${pagination.sort} ${pagination.order}
     LIMIT $2 OFFSET $3`,
    [customer.id, pagination.limit, pagination.offset]
  );
  const count = await db.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM payments WHERE customer_id = $1",
    [customer.id]
  );

  return {
    statusCode: 200,
    body: {
      success: true,
      data: payments.rows,
      pagination: buildPaginationMeta(pagination.page, pagination.limit, count.rows[0].count),
    },
  };
}
