import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AuthUser } from "../services/auth.service.js";

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    (req as AuthenticatedRequest).user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

export function ownsAccount(req: Request, accountNumber: string) {
  return (req as AuthenticatedRequest).user.account_number === accountNumber;
}
