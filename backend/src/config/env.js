const DEFAULT_PORT = 3000;
const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/gamer_store";
const DEFAULT_DATABASE_POOL_MAX = 10;

function parsePort(value) {
  if (value === undefined || value === "") {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

function parseBoolean(value, name, defaultValue = false) {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`${name} must be either true or false`);
}

function parsePositiveInteger(value, name, defaultValue) {
  if (value === undefined || value === "") {
    return defaultValue;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return number;
}

function parseDatabaseUrl(value) {
  const databaseUrl = value || DEFAULT_DATABASE_URL;
  let parsedUrl;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL");
  }

  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol");
  }

  return databaseUrl;
}

const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parsePort(process.env.PORT),
  database: Object.freeze({
    connectionString: parseDatabaseUrl(process.env.DATABASE_URL),
    ssl: parseBoolean(process.env.DATABASE_SSL, "DATABASE_SSL"),
    max: parsePositiveInteger(
      process.env.DATABASE_POOL_MAX,
      "DATABASE_POOL_MAX",
      DEFAULT_DATABASE_POOL_MAX,
    ),
  }),
});

module.exports = {
  config,
  parseBoolean,
  parseDatabaseUrl,
  parsePort,
  parsePositiveInteger,
};
