const express = require("express");

const {
  createCategoriesController,
} = require("../controllers/categories.controller");
const { validate } = require("../middlewares/validate.middleware");
const {
  createCategoriesRepository,
} = require("../repositories/categories.repository");
const { createCategoriesService } = require("../services/categories.service");
const {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} = require("../validators/category.schemas");

function createCategoriesRouter({ database }) {
  const router = express.Router();
  const repository = createCategoriesRepository(database);
  const service = createCategoriesService(repository);
  const controller = createCategoriesController(service);

  router.get("/", controller.list);
  router.get(
    "/:id",
    validate({ params: categoryIdSchema }),
    controller.get,
  );
  router.post(
    "/",
    validate({ body: createCategorySchema }),
    controller.create,
  );
  router.patch(
    "/:id",
    validate({ params: categoryIdSchema, body: updateCategorySchema }),
    controller.update,
  );
  router.delete(
    "/:id",
    validate({ params: categoryIdSchema }),
    controller.remove,
  );

  return router;
}

module.exports = { createCategoriesRouter };
