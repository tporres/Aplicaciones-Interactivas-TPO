const database = require("./database");

async function main() {
  try {
    const { database_time: databaseTime } = await database.checkConnection();
    console.log(`PostgreSQL connection successful at ${databaseTime.toISOString()}`);
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  console.error("PostgreSQL connection failed.", error.message);
  process.exitCode = 1;
});
