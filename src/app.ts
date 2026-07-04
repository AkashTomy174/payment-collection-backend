import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { authRoutes } from "./routes/auth.routes.js";
import { customerRoutes } from "./routes/customer.routes.js";
import { paymentRoutes } from "./routes/payment.routes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/payments", paymentRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);
