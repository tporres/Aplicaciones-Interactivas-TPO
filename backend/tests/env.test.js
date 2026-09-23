const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  parseBoolean,
  parseDatabaseUrl,
  parsePort,
  parsePositiveInteger,
} = require("../src/config/env");

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

  it("parses boolean configuration values", () => {
    assert.equal(parseBoolean("true", "EXAMPLE"), true);
    assert.equal(parseBoolean("false", "EXAMPLE"), false);
    assert.equal(parseBoolean(undefined, "EXAMPLE"), false);
    assert.throws(
      () => parseBoolean("yes", "EXAMPLE"),
      /EXAMPLE must be either true or false/,
    );
  });

  it("parses positive integer configuration values", () => {
    assert.equal(parsePositiveInteger("5", "EXAMPLE", 10), 5);
    assert.equal(parsePositiveInteger(undefined, "EXAMPLE", 10), 10);
    assert.throws(
      () => parsePositiveInteger("0", "EXAMPLE", 10),
      /EXAMPLE must be a positive integer/,
    );
  });

  it("accepts only PostgreSQL database URLs", () => {
    const url = "postgresql://user:password@localhost:5432/database";

    assert.equal(parseDatabaseUrl(url), url);
    assert.throws(
      () => parseDatabaseUrl("mysql://localhost/database"),
      /DATABASE_URL must use the postgres or postgresql protocol/,
    );
  });
});
