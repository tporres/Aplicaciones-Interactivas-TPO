const express = require("express");

const { config } = require("./config/env");
const database = require("./db/database");
const { createAuthenticate } = require("./middlewares/auth.middleware");
const { createAuthRouters } = require("./routes/auth.routes");
const { createCategoriesRouter } = require("./routes/categories.routes");
const { createHealthRouter } = require("./routes/health.routes");
const { createInquiriesRouter } = require("./routes/inquiries.routes");
const { createStoreRouter } = require("./routes/store.routes");
const { errorHandler } = require("./middlewares/error.middleware");
const { notFoundHandler } = require("./middlewares/not-found.middleware");

function createApp(dependencies = {}) {
  const app = express();
  const appDatabase = dependencies.database || database;
  const authenticate = createAuthenticate({
    database: appDatabase,
    authConfig: config.auth,
  });
  const { authRouter, profileRouter } = createAuthRouters({
    database: appDatabase,
    authenticate,
    authConfig: config.auth,
    nodeEnv: config.nodeEnv,
  });

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/profile", profileRouter);
  app.use(
    "/api/v1/health",
    createHealthRouter({ database: appDatabase }),
  );
  app.use(
    "/api/v1/categories",
    createCategoriesRouter({ database: appDatabase, authenticate }),
  );
  app.use(
    "/api/v1/store",
    createStoreRouter({ database: appDatabase, authenticate }),
  );
  app.use(
    "/api/v1/inquiries",
    createInquiriesRouter({ database: appDatabase, authenticate }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
