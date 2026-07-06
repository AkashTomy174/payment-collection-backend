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

test("GET /customers/all is admin-only", async () => {
  const customer = await login("demo@example.com", "password123");
  const admin = await login("admin@example.com", "password123");

  const customerResponse = await fetch(`${baseUrl}/customers/all`, {
    headers: {
      Authorization: `Bearer ${customer.token}`,
    },
  });
  const customerBody = await customerResponse.json();

  assert.equal(customerResponse.status, 403);
  assert.deepEqual(customerBody, {
    success: false,
    message: "Admin access required",
  });

  const adminResponse = await fetch(`${baseUrl}/customers/all`, {
    headers: {
      Authorization: `Bearer ${admin.token}`,
    },
  });
  const adminBody = await adminResponse.json();

  assert.equal(adminResponse.status, 200);
  assert.equal(adminBody.success, true);
  assert.ok(Array.isArray(adminBody.data));
  assert.equal(adminBody.data.length, 3);
});
