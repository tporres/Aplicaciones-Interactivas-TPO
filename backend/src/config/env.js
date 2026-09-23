const DEFAULT_PORT = 3000;
const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/gamer_store";
const DEFAULT_DATABASE_POOL_MAX = 10;
const DEFAULT_JWT_EXPIRES_SECONDS = 8 * 60 * 60;
const DEFAULT_PASSWORD_RESET_EXPIRES_MINUTES = 30;
const DEFAULT_BCRYPT_ROUNDS = 10;
const DEVELOPMENT_JWT_SECRET = "development-only-secret-change-before-production";

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

function parseJwtSecret(value, nodeEnv) {
  if (value) {
    if (value.length < 32) {
      throw new Error("JWT_SECRET must contain at least 32 characters");
    }

    return value;
  }

  if (nodeEnv === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return DEVELOPMENT_JWT_SECRET;
}

const nodeEnv = process.env.NODE_ENV || "development";

const config = Object.freeze({
  nodeEnv,
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
  auth: Object.freeze({
    jwtSecret: parseJwtSecret(process.env.JWT_SECRET, nodeEnv),
    jwtExpiresSeconds: parsePositiveInteger(
      process.env.JWT_EXPIRES_SECONDS,
      "JWT_EXPIRES_SECONDS",
      DEFAULT_JWT_EXPIRES_SECONDS,
    ),
    passwordResetExpiresMinutes: parsePositiveInteger(
      process.env.PASSWORD_RESET_EXPIRES_MINUTES,
      "PASSWORD_RESET_EXPIRES_MINUTES",
      DEFAULT_PASSWORD_RESET_EXPIRES_MINUTES,
    ),
    bcryptRounds: parsePositiveInteger(
      process.env.BCRYPT_ROUNDS,
      "BCRYPT_ROUNDS",
      DEFAULT_BCRYPT_ROUNDS,
    ),
  }),
});

module.exports = {
  config,
  parseBoolean,
  parseDatabaseUrl,
  parseJwtSecret,
  parsePort,
  parsePositiveInteger,
};
