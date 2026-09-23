const express = require("express");

const { createStoreController } = require("../controllers/store.controller");
const { validate } = require("../middlewares/validate.middleware");
const { createStoreRepository } = require("../repositories/store.repository");
const { storeSchema } = require("../validators/store.schemas");

function createStoreRouter({ database, authenticate }) {
  const router = express.Router();
  const repository = createStoreRepository(database);
  const controller = createStoreController(repository);

  router.get("/", controller.get);
  router.put(
    "/",
    authenticate,
    validate({ body: storeSchema }),
    controller.upsert,
  );

  return router;
}

module.exports = { createStoreRouter };
