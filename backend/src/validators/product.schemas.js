const { z } = require("zod");

const productIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "id must be a positive integer")
    .transform(Number)
    .pipe(z.number().int().positive("id must be a positive integer")),
});

const categoryIdSchema = z.coerce.number().int().positive();
const availabilitySchema = z.enum(["in_stock", "out_of_stock", "preorder"]);
const productFields = {
  categoryId: categoryIdSchema,
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
  imageUrl: z.url("imageUrl must be a valid URL").max(2000),
  price: z.coerce.number().min(0).max(9999999999.99),
  availability: availabilitySchema,
  isActive: z.boolean(),
};

const createProductSchema = z
  .object({
    ...productFields,
    availability: availabilitySchema.default("in_stock"),
    isActive: z.boolean().default(true),
  })
  .strict();

const updateProductSchema = z
  .object({
    categoryId: productFields.categoryId.optional(),
    name: productFields.name.optional(),
    description: productFields.description.optional(),
    imageUrl: productFields.imageUrl.optional(),
    price: productFields.price.optional(),
    availability: productFields.availability.optional(),
    isActive: productFields.isActive.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

const publicProductQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    categoryId: categoryIdSchema.optional(),
    availability: availabilitySchema.optional(),
    sort: z
      .enum(["newest", "name", "price_asc", "price_desc"])
      .default("newest"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
  })
  .strict();

const adminProductQuerySchema = publicProductQuerySchema.extend({
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

module.exports = {
  adminProductQuerySchema,
  createProductSchema,
  productIdSchema,
  publicProductQuerySchema,
  updateProductSchema,
};
