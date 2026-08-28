const { createApp } = require("./app");
const { config } = require("./config/env");

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Closing HTTP server.`);

  server.close((error) => {
    if (error) {
      console.error("Failed to close HTTP server.", error);
      process.exitCode = 1;
      return;
    }

    process.exitCode = 0;
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
