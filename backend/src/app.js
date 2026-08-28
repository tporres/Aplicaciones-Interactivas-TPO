const express = require("express");

const healthRouter = require("./routes/health.routes");
const { errorHandler } = require("./middlewares/error.middleware");
const { notFoundHandler } = require("./middlewares/not-found.middleware");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/v1/health", healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
