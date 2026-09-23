const express = require("express");

const {
  createInquiriesController,
} = require("../controllers/inquiries.controller");
const { validate } = require("../middlewares/validate.middleware");
const {
  createInquiriesRepository,
} = require("../repositories/inquiries.repository");
const { createInquiriesService } = require("../services/inquiries.service");
const {
  createInquirySchema,
  inquiryIdSchema,
  listInquiriesQuerySchema,
  updateInquiryStatusSchema,
} = require("../validators/inquiry.schemas");

function createInquiriesRouter({ database, authenticate }) {
  const router = express.Router();
  const repository = createInquiriesRepository(database);
  const service = createInquiriesService(repository);
  const controller = createInquiriesController(service);

  router.post(
    "/",
    validate({ body: createInquirySchema }),
    controller.create,
  );

  router.use(authenticate);
  router.get(
    "/",
    validate({ query: listInquiriesQuerySchema }),
    controller.list,
  );
  router.get(
    "/:id",
    validate({ params: inquiryIdSchema }),
    controller.get,
  );
  router.patch(
    "/:id/status",
    validate({ params: inquiryIdSchema, body: updateInquiryStatusSchema }),
    controller.updateStatus,
  );
  router.delete(
    "/:id",
    validate({ params: inquiryIdSchema }),
    controller.remove,
  );

  return router;
}

module.exports = { createInquiriesRouter };
