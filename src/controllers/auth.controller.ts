import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service.js";

export async function register(req: Request, res: Response) {
  const result = await registerUser(req.body);
  return res.status(result.statusCode).json(result.body);
}

export async function login(req: Request, res: Response) {
  const result = await loginUser(req.body);
  return res.status(result.statusCode).json(result.body);
}
