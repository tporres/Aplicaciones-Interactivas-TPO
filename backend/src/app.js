const express = require("express");

const database = require("./db/database");
const { createCategoriesRouter } = require("./routes/categories.routes");
const { createHealthRouter } = require("./routes/health.routes");
const { errorHandler } = require("./middlewares/error.middleware");
const { notFoundHandler } = require("./middlewares/not-found.middleware");

function createApp(dependencies = {}) {
  const app = express();
  const appDatabase = dependencies.database || database;

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.use(
    "/api/v1/health",
    createHealthRouter({ database: appDatabase }),
  );
  app.use(
    "/api/v1/categories",
    createCategoriesRouter({ database: appDatabase }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
