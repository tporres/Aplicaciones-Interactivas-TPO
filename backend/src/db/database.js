const { Pool } = require("pg");

const { config } = require("../config/env");

let pool;

function createPool(databaseConfig = config.database) {
  return new Pool({
    connectionString: databaseConfig.connectionString,
    max: databaseConfig.max,
    ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : false,
  });
}

function getPool() {
  if (!pool) {
    pool = createPool();
    pool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error.", error);
    });
  }

  return pool;
}

function query(text, values) {
  return getPool().query(text, values);
}

async function withTransaction(callback) {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function checkConnection() {
  const result = await query("SELECT NOW() AS database_time");
  return result.rows[0];
}

async function close() {
  if (!pool) {
    return;
  }

  const activePool = pool;
  pool = undefined;
  await activePool.end();
}

module.exports = {
  checkConnection,
  close,
  createPool,
  query,
  withTransaction,
};
