const assert = require("node:assert/strict");
const { once } = require("node:events");
const { after, before, describe, it } = require("node:test");

const { createApp } = require("../src/app");

describe("HTTP API", () => {
  let baseUrl;
  let server;
  const database = {
    checkConnection: async () => ({ database_time: new Date() }),
  };

  before(async () => {
    server = createApp({ database }).listen(0, "127.0.0.1");
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

  it("returns the API readiness status", async () => {
    const response = await fetch(`${baseUrl}/api/v1/health/ready`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: "ready",
      database: "connected",
    });
  });

  it("returns 503 when the database is unavailable", async () => {
    const unavailableServer = createApp({
      database: {
        checkConnection: async () => {
          throw new Error("database unavailable");
        },
      },
    }).listen(0, "127.0.0.1");
    await once(unavailableServer, "listening");

    try {
      const address = unavailableServer.address();
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/v1/health/ready`,
      );

      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {
        status: "unavailable",
        database: "disconnected",
      });
    } finally {
      await new Promise((resolve, reject) => {
        unavailableServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
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
