import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { findCustomerByAccount } from "./customer.service.js";

const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-me";
const expiresIn = "7d";

type UserRow = {
  id: number;
  customer_id: number;
  name: string;
  email: string;
  password_hash: string;
  account_number: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  account_number: string;
};

function publicUser(user: UserRow): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    account_number: user.account_number,
  };
}

function signToken(user: AuthUser) {
  return jwt.sign(user, jwtSecret, { expiresIn });
}

export function verifyToken(token: string) {
  return jwt.verify(token, jwtSecret) as AuthUser;
}

export async function registerUser(input: { name: string; email: string; password: string; accountNumber: string }) {
  const customer = await findCustomerByAccount(input.accountNumber);
  if (!customer) {
    return { statusCode: 404, body: { success: false, message: "Linked loan account not found" } };
  }

  const existing = await db.query<UserRow>("SELECT id FROM users WHERE email = $1", [input.email]);
  if (existing.rows.length) {
    return { statusCode: 409, body: { success: false, message: "Email already registered" } };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const result = await db.query<UserRow>(
    `INSERT INTO users (customer_id, name, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, customer_id, name, email, password_hash, $5::text AS account_number`,
    [customer.id, input.name, input.email, passwordHash, customer.account_number]
  );
  const user = publicUser(result.rows[0]);

  return {
    statusCode: 201,
    body: {
      success: true,
      token: signToken(user),
      user,
      customer,
    },
  };
}

export async function loginUser(input: { email: string; password: string }) {
  const result = await db.query<UserRow>(
    `SELECT u.id,
            u.customer_id,
            u.name,
            u.email,
            u.password_hash,
            c.account_number
     FROM users u
     JOIN customers c ON c.id = u.customer_id
     WHERE u.email = $1`,
    [input.email]
  );
  const userRow = result.rows[0];
  if (!userRow || !(await bcrypt.compare(input.password, userRow.password_hash))) {
    return { statusCode: 401, body: { success: false, message: "Invalid email or password" } };
  }

  const user = publicUser(userRow);
  const customer = await findCustomerByAccount(user.account_number);

  return {
    statusCode: 200,
    body: {
      success: true,
      token: signToken(user),
      user,
      customer,
    },
  };
}
