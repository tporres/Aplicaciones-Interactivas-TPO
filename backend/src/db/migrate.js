const { readdir, readFile } = require("node:fs/promises");
const path = require("node:path");

const database = require("./database");

const MIGRATIONS_DIRECTORY = path.join(__dirname, "migrations");
const MIGRATION_LOCK_ID = 73421519;

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version varchar(255) PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT NOW()
    )
  `);
}

async function readMigrations() {
  const entries = await readdir(MIGRATIONS_DIRECTORY, { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    filenames.map(async (filename) => ({
      version: filename,
      sql: await readFile(path.join(MIGRATIONS_DIRECTORY, filename), "utf8"),
    })),
  );
}

async function migrate() {
  const pool = database.createPool();
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await ensureMigrationsTable(client);

    const appliedResult = await client.query(
      "SELECT version FROM schema_migrations ORDER BY version",
    );
    const appliedVersions = new Set(
      appliedResult.rows.map(({ version }) => version),
    );
    const migrations = await readMigrations();
    let appliedCount = 0;

    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      await client.query("BEGIN");

      try {
        await client.query(migration.sql);
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [migration.version],
        );
        await client.query("COMMIT");
        appliedCount += 1;
        console.log(`Applied migration ${migration.version}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log(
      appliedCount === 0
        ? "Database schema is already up to date."
        : `Applied ${appliedCount} migration(s).`,
    );
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    } finally {
      client.release();
      await pool.end();
    }
  }
}

if (require.main === module) {
  migrate().catch((error) => {
    console.error("Database migration failed.", error);
    process.exitCode = 1;
  });
}

module.exports = { migrate };
