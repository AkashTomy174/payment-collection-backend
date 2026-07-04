import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error("Unhandled API error", { message: error.message, stack: error.stack });
  res.status(500).json({ success: false, message: "Internal server error" });
}
