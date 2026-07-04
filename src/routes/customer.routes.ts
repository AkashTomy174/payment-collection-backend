import { Router } from "express";
import { getCustomer, getCustomers } from "../controllers/customer.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const customerRoutes = Router();

customerRoutes.use(requireAuth);
customerRoutes.get("/", getCustomers);
customerRoutes.get("/:accountNumber", getCustomer);
