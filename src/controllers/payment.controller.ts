import type { Request, Response } from "express";
import { ownsAccount } from "../middleware/auth.js";
import { createPayment, listPaymentsByAccount } from "../services/payment.service.js";

export async function postPayment(req: Request, res: Response) {
  if (!ownsAccount(req, req.body.accountNumber)) {
    return res.status(403).json({ success: false, message: "You can only pay your linked loan account" });
  }

  const result = await createPayment(req.body.accountNumber, req.body.amount);
  res.status(result.statusCode).json(result.body);
}

export async function getPaymentsByAccount(req: Request, res: Response) {
  const accountNumber = String(req.params.account_number);
  if (!ownsAccount(req, accountNumber)) {
    return res.status(403).json({ success: false, message: "You can only view your linked loan account" });
  }

  const result = await listPaymentsByAccount(accountNumber, req.query);
  res.status(result.statusCode).json(result.body);
}
