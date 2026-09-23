const { z } = require("zod");

const socialLinksSchema = z
  .record(z.string(), z.url("social link must be a valid URL"))
  .default({});

const storeSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    description: z.string().trim().min(1).max(5000),
    address: z.string().trim().min(1).max(300),
    phone: z.string().trim().min(5).max(50),
    socialLinks: socialLinksSchema,
    openingHours: z.string().trim().min(1).max(1000),
  })
  .strict();

module.exports = { storeSchema };
