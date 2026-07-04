import { Router } from "express";
import { z } from "zod";
import { login, register } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validateRequest.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).toLowerCase(),
  password: z.string().min(6).max(120),
  accountNumber: z.string().trim().min(3).max(20),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(160).toLowerCase(),
  password: z.string().min(1).max(120),
});

export const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), register);
authRoutes.post("/login", validateBody(loginSchema), login);
