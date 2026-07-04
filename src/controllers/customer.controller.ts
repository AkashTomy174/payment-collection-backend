import type { Request, Response } from "express";
import { ownsAccount, type AuthenticatedRequest } from "../middleware/auth.js";
import { findCustomerByAccount } from "../services/customer.service.js";

export async function getCustomers(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const customer = await findCustomerByAccount(user.account_number);
  res.json({ success: true, data: customer ? [customer] : [], pagination: { page: 1, limit: 1, totalCount: customer ? 1 : 0, totalPages: customer ? 1 : 0, hasNextPage: false, hasPrevPage: false } });
}

export async function getCustomer(req: Request, res: Response) {
  const accountNumber = String(req.params.accountNumber);
  if (!ownsAccount(req, accountNumber)) {
    return res.status(403).json({ success: false, message: "You can only access your linked loan account" });
  }

  const customer = await findCustomerByAccount(accountNumber);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer account not found" });
  }

  return res.json({ success: true, data: customer });
}
