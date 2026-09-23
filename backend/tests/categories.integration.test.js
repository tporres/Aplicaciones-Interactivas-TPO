const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, describe, it } = require("node:test");

const { createApp } = require("../src/app");
const { createPool } = require("../src/db/database");
const { migrate } = require("../src/db/migrate");

const connectionString = process.env.TEST_DATABASE_URL;

describe(
  "categories API integration",
  { skip: !connectionString },
  () => {
    let baseUrl;
    let pool;
    let server;

    before(async () => {
      const databaseConfig = {
        connectionString,
        max: 5,
        ssl: false,
      };

      await migrate();
      pool = createPool(databaseConfig);
      await pool.query("TRUNCATE TABLE categories RESTART IDENTITY CASCADE");

      const database = {
        checkConnection: () => pool.query("SELECT 1"),
        query: (text, values) => pool.query(text, values),
      };
      server = createApp({ database }).listen(0, "127.0.0.1");
      await once(server, "listening");
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
    });

    after(async () => {
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      }

      if (pool) {
        await pool.end();
      }
    });

    it("creates, lists, reads, updates, and deletes a category", async () => {
      const createResponse = await fetch(`${baseUrl}/api/v1/categories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Graphics Cards",
          description: "Dedicated GPUs",
        }),
      });

      assert.equal(createResponse.status, 201);
      assert.equal(createResponse.headers.get("location"), "/api/v1/categories/1");
      const created = (await createResponse.json()).data;
      assert.equal(created.id, 1);
      assert.equal(created.name, "Graphics Cards");
      assert.equal(created.description, "Dedicated GPUs");
      assert.ok(created.createdAt);
      assert.ok(created.updatedAt);

      const listResponse = await fetch(`${baseUrl}/api/v1/categories`);
      assert.equal(listResponse.status, 200);
      assert.deepEqual((await listResponse.json()).data, [created]);

      const getResponse = await fetch(
        `${baseUrl}/api/v1/categories/${created.id}`,
      );
      assert.equal(getResponse.status, 200);
      assert.deepEqual((await getResponse.json()).data, created);

      const updateResponse = await fetch(
        `${baseUrl}/api/v1/categories/${created.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ description: "High-performance GPUs" }),
        },
      );
      assert.equal(updateResponse.status, 200);
      const updated = (await updateResponse.json()).data;
      assert.equal(updated.name, created.name);
      assert.equal(updated.description, "High-performance GPUs");

      const deleteResponse = await fetch(
        `${baseUrl}/api/v1/categories/${created.id}`,
        { method: "DELETE" },
      );
      assert.equal(deleteResponse.status, 204);

      const missingResponse = await fetch(
        `${baseUrl}/api/v1/categories/${created.id}`,
      );
      assert.equal(missingResponse.status, 404);
      assert.deepEqual(await missingResponse.json(), {
        error: {
          code: "CATEGORY_NOT_FOUND",
          message: "Category not found",
        },
      });
    });

    it("validates category input and rejects duplicate names", async () => {
      const invalidResponse = await fetch(`${baseUrl}/api/v1/categories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "  " }),
      });

      assert.equal(invalidResponse.status, 400);
      const invalidBody = await invalidResponse.json();
      assert.equal(invalidBody.error.code, "VALIDATION_ERROR");
      assert.deepEqual(invalidBody.error.details, [
        { field: "name", message: "name is required" },
      ]);

      const firstResponse = await fetch(`${baseUrl}/api/v1/categories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Processors" }),
      });
      assert.equal(firstResponse.status, 201);

      const duplicateResponse = await fetch(`${baseUrl}/api/v1/categories`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "processors" }),
      });
      assert.equal(duplicateResponse.status, 409);
      assert.deepEqual(await duplicateResponse.json(), {
        error: {
          code: "CATEGORY_NAME_CONFLICT",
          message: "A category with that name already exists",
        },
      });
    });

    it("rejects invalid identifiers and empty updates", async () => {
      const invalidIdResponse = await fetch(
        `${baseUrl}/api/v1/categories/not-a-number`,
      );
      assert.equal(invalidIdResponse.status, 400);
      assert.equal(
        (await invalidIdResponse.json()).error.code,
        "VALIDATION_ERROR",
      );

      const emptyUpdateResponse = await fetch(
        `${baseUrl}/api/v1/categories/1`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      assert.equal(emptyUpdateResponse.status, 400);
      assert.equal(
        (await emptyUpdateResponse.json()).error.code,
        "VALIDATION_ERROR",
      );
    });
  },
);
