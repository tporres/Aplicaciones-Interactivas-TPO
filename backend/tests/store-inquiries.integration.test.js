const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, describe, it } = require("node:test");

const { createApp } = require("../src/app");
const { createPool } = require("../src/db/database");
const { migrate } = require("../src/db/migrate");

const connectionString = process.env.TEST_DATABASE_URL;

describe(
  "store and inquiries API integration",
  { skip: !connectionString },
  () => {
    let baseUrl;
    let pool;
    let server;
    let token;

    before(async () => {
      await migrate();
      pool = createPool({ connectionString, max: 5, ssl: false });
      await pool.query(
        `
          TRUNCATE TABLE
            administrators,
            store_information,
            inquiries
          RESTART IDENTITY CASCADE
        `,
      );

      const database = {
        checkConnection: () => pool.query("SELECT 1"),
        query: (text, values) => pool.query(text, values),
      };
      server = createApp({ database }).listen(0, "127.0.0.1");
      await once(server, "listening");
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;

      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName: "Store",
          lastName: "Admin",
          email: "store@example.com",
          phone: "+54 11 5555 1111",
          password: "StrongPass123!",
        }),
      });
      token = (await response.json()).data.token;
    });

    after(async () => {
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }
      if (pool) {
        await pool.end();
      }
    });

    it("creates, updates, and publicly exposes institutional information", async () => {
      const missingResponse = await fetch(`${baseUrl}/api/v1/store`);
      assert.equal(missingResponse.status, 404);

      const store = {
        name: "Pixel Forge Hardware",
        description: "Gaming hardware and expert advice.",
        address: "Av. Corrientes 1234, CABA",
        phone: "+54 11 4444 4444",
        socialLinks: {
          instagram: "https://instagram.com/pixelforge",
          facebook: "https://facebook.com/pixelforge",
        },
        openingHours: "Monday to Saturday, 10:00-19:00",
      };
      const unauthorizedResponse = await fetch(`${baseUrl}/api/v1/store`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(store),
      });
      assert.equal(unauthorizedResponse.status, 401);

      const createResponse = await fetch(`${baseUrl}/api/v1/store`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(store),
      });
      assert.equal(createResponse.status, 200);
      assert.equal((await createResponse.json()).data.name, store.name);

      const updateResponse = await fetch(`${baseUrl}/api/v1/store`, {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ ...store, phone: "+54 11 4000 0000" }),
      });
      assert.equal(updateResponse.status, 200);

      const publicResponse = await fetch(`${baseUrl}/api/v1/store`);
      assert.equal(publicResponse.status, 200);
      const publicStore = (await publicResponse.json()).data;
      assert.equal(publicStore.phone, "+54 11 4000 0000");
      assert.deepEqual(publicStore.socialLinks, store.socialLinks);
    });

    it("stores public inquiries and supports administrator management", async () => {
      const inquiryValues = {
        name: "Grace Hopper",
        email: "grace@example.com",
        phone: null,
        subject: "GPU availability",
        message: "Do you have the latest graphics cards in stock?",
      };
      const createResponse = await fetch(`${baseUrl}/api/v1/inquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(inquiryValues),
      });
      assert.equal(createResponse.status, 201);
      const created = (await createResponse.json()).data;
      assert.equal(created.status, "pending");

      const unauthorizedList = await fetch(`${baseUrl}/api/v1/inquiries`);
      assert.equal(unauthorizedList.status, 401);

      const listResponse = await fetch(
        `${baseUrl}/api/v1/inquiries?status=pending&page=1&limit=10`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      assert.equal(listResponse.status, 200);
      const list = await listResponse.json();
      assert.equal(list.meta.total, 1);
      assert.equal(list.data[0].id, created.id);

      const getResponse = await fetch(
        `${baseUrl}/api/v1/inquiries/${created.id}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      assert.equal(getResponse.status, 200);

      const statusResponse = await fetch(
        `${baseUrl}/api/v1/inquiries/${created.id}/status`,
        {
          method: "PATCH",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ status: "answered" }),
        },
      );
      assert.equal(statusResponse.status, 200);
      assert.equal((await statusResponse.json()).data.status, "answered");

      const deleteResponse = await fetch(
        `${baseUrl}/api/v1/inquiries/${created.id}`,
        {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` },
        },
      );
      assert.equal(deleteResponse.status, 204);

      const missingResponse = await fetch(
        `${baseUrl}/api/v1/inquiries/${created.id}`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      assert.equal(missingResponse.status, 404);
    });

    it("validates public inquiry data", async () => {
      const response = await fetch(`${baseUrl}/api/v1/inquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Visitor",
          email: "not-an-email",
          subject: "Question",
          message: "Hello",
        }),
      });

      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, "VALIDATION_ERROR");
    });
  },
);
