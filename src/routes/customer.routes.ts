import { Router } from "express";
import { getAllCustomers, getCustomer, getCustomers } from "../controllers/customer.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const customerRoutes = Router();

customerRoutes.use(requireAuth);
customerRoutes.get("/all", requireAdmin, getAllCustomers);
customerRoutes.get("/", getCustomers);
customerRoutes.get("/:accountNumber", getCustomer);
