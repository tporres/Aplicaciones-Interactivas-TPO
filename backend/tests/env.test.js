const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { parsePort } = require("../src/config/env");

describe("environment configuration", () => {
  it("uses port 3000 when PORT is not defined", () => {
    assert.equal(parsePort(undefined), 3000);
  });

  it("parses a valid port", () => {
    assert.equal(parsePort("8080"), 8080);
  });

  it("rejects an invalid port", () => {
    assert.throws(
      () => parsePort("invalid"),
      /PORT must be an integer between 1 and 65535/,
    );
  });
});
