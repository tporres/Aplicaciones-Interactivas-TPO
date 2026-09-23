const { createApp } = require("./app");
const { config } = require("./config/env");
const database = require("./db/database");

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`${signal} received. Closing HTTP server.`);

  server.close(async (error) => {
    if (error) {
      console.error("Failed to close HTTP server.", error);
      process.exitCode = 1;
    }

    try {
      await database.close();
    } catch (databaseError) {
      console.error("Failed to close PostgreSQL pool.", databaseError);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
