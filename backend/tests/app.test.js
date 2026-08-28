const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, describe, it } = require("node:test");

const { createApp } = require("../src/app");

describe("HTTP API", () => {
  let baseUrl;
  let server;

  before(async () => {
    server = createApp().listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it("returns the API health status", async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`);

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^application\/json/);
    assert.deepEqual(await response.json(), { status: "ok" });
  });

  it("returns a JSON 404 response for an unknown route", async () => {
    const response = await fetch(`${baseUrl}/api/v1/unknown`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: "NOT_FOUND",
        message: "Route GET /api/v1/unknown not found",
      },
    });
  });

  it("returns a JSON 400 response for an invalid JSON body", async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON",
      },
    });
  });
});
