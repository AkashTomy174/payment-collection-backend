import { Router } from "express";
import { z } from "zod";
import { getPaymentsByAccount, postPayment } from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validateRequest.js";

const paymentSchema = z.object({
  accountNumber: z.string().trim().min(3).max(20),
  amount: z.coerce.number().positive(),
});

export const paymentRoutes = Router();

paymentRoutes.use(requireAuth);
paymentRoutes.post("/", validateBody(paymentSchema), postPayment);
paymentRoutes.get("/:account_number", getPaymentsByAccount);
