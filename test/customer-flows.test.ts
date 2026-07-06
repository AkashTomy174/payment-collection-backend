import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.USE_MEMORY_DB = "true";
process.env.JWT_SECRET = "test-secret";
process.env.CORS_ORIGIN = "*";
process.env.NODE_ENV = "test";

let app: { listen: (port: number, callback: () => void) => import("node:http").Server };
let server!: import("node:http").Server;
let baseUrl = "";

before(async () => {
  ({ app } = await import("../src/app.js"));
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      if (typeof address === "object" && address && "port" in address) {
        baseUrl = `http://127.0.0.1:${address.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

async function login(email: string, password: string) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();
  assert.equal(response.ok, true, `Expected login for ${email} to succeed`);
  return body as { token: string };
}

test("regular users still cannot access another loan", async () => {
  const session = await login("demo@example.com", "password123");

  const response = await fetch(`${baseUrl}/customers/AC20485611`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  });

  const body = await response.json();
  assert.equal(response.status, 403);
  assert.deepEqual(body, {
    success: false,
    message: "You can only access your linked loan account",
  });
});

test("customer payment flow still works", async () => {
  const session = await login("demo@example.com", "password123");

  const paymentResponse = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({
      accountNumber: "AC10293847",
      amount: 14250,
    }),
  });

  const paymentBody = await paymentResponse.json();
  assert.equal(paymentResponse.status, 201);
  assert.equal(paymentBody.success, true);
  assert.equal(paymentBody.message, "Payment recorded successfully");

  const historyResponse = await fetch(`${baseUrl}/payments/AC10293847?page=1&limit=10&sort=payment_date&order=desc`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  });

  const historyBody = await historyResponse.json();
  assert.equal(historyResponse.status, 200);
  assert.equal(historyBody.success, true);
  assert.ok(Array.isArray(historyBody.data));
  assert.ok(historyBody.data.length >= 2);
});
