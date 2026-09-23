const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, describe, it } = require("node:test");

const { createApp } = require("../src/app");
const defaultDatabase = require("../src/db/database");
const { migrate } = require("../src/db/migrate");
const { seed } = require("../src/db/seed");

const connectionString = process.env.TEST_DATABASE_URL;

describe("products API integration", { skip: !connectionString }, () => {
  let baseUrl;
  let categoryId;
  let pool;
  let server;
  let token;

  before(async () => {
    await migrate();
    pool = defaultDatabase.createPool({ connectionString, max: 5, ssl: false });
    await pool.query(
      `
        TRUNCATE TABLE
          administrators,
          categories,
          products
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

    const registerResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName: "Product",
        lastName: "Admin",
        email: "products@example.com",
        phone: "+54 11 5555 2222",
        password: "StrongPass123!",
      }),
    });
    token = (await registerResponse.json()).data.token;

    const categoryResponse = await fetch(`${baseUrl}/api/v1/categories`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Graphics Cards",
        description: "Dedicated GPUs",
      }),
    });
    categoryId = (await categoryResponse.json()).data.id;
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
    await defaultDatabase.close();
  });

  it("creates and exposes an active product with search and filters", async () => {
    const productValues = {
      categoryId,
      name: "Nova RTX 5090",
      description: "Ultra gaming graphics card with 32GB VRAM",
      imageUrl: "https://placehold.co/800x600?text=Nova+RTX+5090",
      price: 2499999.99,
      availability: "in_stock",
      isActive: true,
    };
    const unauthorizedResponse = await fetch(
      `${baseUrl}/api/v1/admin/products`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(productValues),
      },
    );
    assert.equal(unauthorizedResponse.status, 401);

    const createResponse = await fetch(`${baseUrl}/api/v1/admin/products`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(productValues),
    });
    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()).data;
    assert.equal(created.name, productValues.name);
    assert.equal(created.price, productValues.price);
    assert.deepEqual(created.category, {
      id: categoryId,
      name: "Graphics Cards",
    });

    const listResponse = await fetch(
      `${baseUrl}/api/v1/products?q=ultra%20gaming&categoryId=${categoryId}&availability=in_stock&sort=price_desc`,
    );
    assert.equal(listResponse.status, 200);
    const list = await listResponse.json();
    assert.equal(list.meta.total, 1);
    assert.equal(list.data[0].id, created.id);

    const getResponse = await fetch(
      `${baseUrl}/api/v1/products/${created.id}`,
    );
    assert.equal(getResponse.status, 200);

    const conflictResponse = await fetch(
      `${baseUrl}/api/v1/admin/products`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ ...productValues, name: "nova rtx 5090" }),
      },
    );
    assert.equal(conflictResponse.status, 409);
  });

  it("deactivates products and retains administrator visibility", async () => {
    const productResult = await pool.query(
      "SELECT id FROM products WHERE name = 'Nova RTX 5090'",
    );
    const productId = productResult.rows[0].id;
    const updateResponse = await fetch(
      `${baseUrl}/api/v1/admin/products/${productId}`,
      {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ isActive: false, availability: "out_of_stock" }),
      },
    );
    assert.equal(updateResponse.status, 200);
    assert.equal((await updateResponse.json()).data.isActive, false);

    const publicResponse = await fetch(
      `${baseUrl}/api/v1/products/${productId}`,
    );
    assert.equal(publicResponse.status, 404);

    const adminListResponse = await fetch(
      `${baseUrl}/api/v1/admin/products?isActive=false`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    assert.equal(adminListResponse.status, 200);
    const adminList = await adminListResponse.json();
    assert.equal(adminList.meta.total, 1);
    assert.equal(adminList.data[0].id, productId);

    const categoryDeleteResponse = await fetch(
      `${baseUrl}/api/v1/categories/${categoryId}`,
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      },
    );
    assert.equal(categoryDeleteResponse.status, 409);

    const deleteResponse = await fetch(
      `${baseUrl}/api/v1/admin/products/${productId}`,
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      },
    );
    assert.equal(deleteResponse.status, 204);

    const categoryDeleteAfterProduct = await fetch(
      `${baseUrl}/api/v1/categories/${categoryId}`,
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      },
    );
    assert.equal(categoryDeleteAfterProduct.status, 204);
  });

  it("loads at least 20 products with an idempotent seed", async () => {
    await seed();
    await seed();

    const result = await pool.query("SELECT count(*)::integer AS count FROM products");
    assert.equal(result.rows[0].count, 20);

    const publicResponse = await fetch(
      `${baseUrl}/api/v1/products?page=1&limit=100`,
    );
    assert.equal(publicResponse.status, 200);
    assert.equal((await publicResponse.json()).meta.total, 20);
  });
});
