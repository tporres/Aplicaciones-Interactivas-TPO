const { z } = require("zod");

const inquiryIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "id must be a positive integer")
    .transform(Number)
    .pipe(z.number().int().positive("id must be a positive integer")),
});

const createInquirySchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    email: z.email("email must be valid").trim().toLowerCase().max(320),
    phone: z.string().trim().min(5).max(50).nullable().optional().default(null),
    subject: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(10000),
  })
  .strict();

const updateInquiryStatusSchema = z
  .object({
    status: z.enum(["pending", "read", "answered"]),
  })
  .strict();

const listInquiriesQuerySchema = z
  .object({
    status: z.enum(["pending", "read", "answered"]).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

module.exports = {
  createInquirySchema,
  inquiryIdSchema,
  listInquiriesQuerySchema,
  updateInquiryStatusSchema,
};
