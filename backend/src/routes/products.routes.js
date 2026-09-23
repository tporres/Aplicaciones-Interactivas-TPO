const express = require("express");

const {
  createProductsController,
} = require("../controllers/products.controller");
const { validate } = require("../middlewares/validate.middleware");
const {
  createProductsRepository,
} = require("../repositories/products.repository");
const { createProductsService } = require("../services/products.service");
const {
  adminProductQuerySchema,
  createProductSchema,
  productIdSchema,
  publicProductQuerySchema,
  updateProductSchema,
} = require("../validators/product.schemas");

function createProductControllers(database) {
  const repository = createProductsRepository(database);
  const service = createProductsService(repository);
  return createProductsController(service);
}

function createProductsRouter({ database }) {
  const router = express.Router();
  const controller = createProductControllers(database);

  router.get(
    "/",
    validate({ query: publicProductQuerySchema }),
    controller.listPublic,
  );
  router.get(
    "/:id",
    validate({ params: productIdSchema }),
    controller.getPublic,
  );

  return router;
}

function createAdminProductsRouter({ database, authenticate }) {
  const router = express.Router();
  const controller = createProductControllers(database);

  router.use(authenticate);
  router.get(
    "/",
    validate({ query: adminProductQuerySchema }),
    controller.listAdmin,
  );
  router.get(
    "/:id",
    validate({ params: productIdSchema }),
    controller.getAdmin,
  );
  router.post(
    "/",
    validate({ body: createProductSchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    validate({ params: productIdSchema, body: updateProductSchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    validate({ params: productIdSchema }),
    controller.remove,
  );

  return router;
}

module.exports = { createAdminProductsRouter, createProductsRouter };
