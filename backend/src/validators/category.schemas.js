const { z } = require("zod");

const categoryIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "id must be a positive integer")
    .transform(Number)
    .pipe(z.number().int().positive("id must be a positive integer")),
});

const nameSchema = z
  .string({ error: "name must be a string" })
  .trim()
  .min(1, "name is required")
  .max(100, "name must contain at most 100 characters");

const descriptionSchema = z
  .string({ error: "description must be a string" })
  .trim()
  .max(2000, "description must contain at most 2000 characters")
  .nullable();

const createCategorySchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema.optional().default(null),
  })
  .strict();

const updateCategorySchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "at least one field must be provided",
  });

module.exports = {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
};
