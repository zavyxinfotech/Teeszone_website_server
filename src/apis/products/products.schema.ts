import { z } from "zod";
import { envelope } from "../../utils/zod";

export const productEntity = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  collections: z.array(z.string()),
  description: z.string(),
  fit: z.string(),
  fabric: z.string(),
  gsm: z.number(),
  mrp: z.number(),
  price: z.number(),
  colors: z.array(
    z.object({
      name: z.string(),
      hex: z.string(),
      image: z.string(),
      backImage: z.string().optional().nullable(),
      chestImage: z.string().optional().nullable(),
      detailImage: z.string().optional().nullable(),
      image4: z.string().optional().nullable(),
      image5: z.string().optional().nullable(),
    }),
  ),
  sizes: z.array(z.string()),
  qtyDiscounts: z.array(z.object({ minQty: z.number(), offPct: z.number() })),
  features: z.array(z.string()),
  isNew: z.boolean(),
  bestSeller: z.boolean(),
  megaSale: z.boolean(),
});

export const adminProductEntity = productEntity.extend({
  isActive: z.boolean(),
  sortOrder: z.number(),
});

const upsertBody = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  description: z.string().min(1),
  fit: z.string().min(1),
  fabric: z.string().min(1),
  gsm: z.number().int().positive(),
  mrp: z.number().int().positive(),
  price: z.number().int().positive(),
  sizes: z.array(z.string().min(1)).min(1),
  features: z.array(z.string()).default([]),
  colors: z
    .array(
      z.object({
        name: z.string().min(1),
        hex: z.string().min(1),
        image: z.string().min(1),
        backImage: z.string().optional().nullable(),
        chestImage: z.string().optional().nullable(),
        detailImage: z.string().optional().nullable(),
        image4: z.string().optional().nullable(),
        image5: z.string().optional().nullable(),
      }),
    )
    .min(1),
  qtyDiscounts: z.array(z.object({ minQty: z.number().int().positive(), offPct: z.number().int().min(0).max(90) })).default([]),
  collections: z.array(z.string()).default([]),
  isNew: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  megaSale: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const listProductsSchema = {
  description: "List active products, optionally filtered by collection slug (virtual slugs filter on flags)",
  tags: ["Catalog"],
  summary: "List products",
  querystring: z.object({ collection: z.string().optional() }),
  response: { 200: envelope(z.array(productEntity)) },
};

export const getProductSchema = {
  description: "Get one product by slug",
  tags: ["Catalog"],
  summary: "Get product",
  params: z.object({ slug: z.string() }),
  response: { 200: envelope(productEntity) },
};

export const adminListProductsSchema = {
  description: "Admin: list all products including inactive",
  tags: ["Admin"],
  summary: "Admin list products",
  security: [{ ApiToken: [] }],
  querystring: z.object({ includeInactive: z.coerce.boolean().optional().default(true) }),
  response: { 200: envelope(z.array(adminProductEntity)) },
};

export const adminGetProductSchema = {
  description: "Admin: get one product by id, including inactive",
  tags: ["Admin"],
  summary: "Admin get product",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  response: { 200: envelope(adminProductEntity) },
};

export const createProductSchema = {
  description: "Admin: create a product (colors/tiers/collection joins written in one transaction)",
  tags: ["Admin"],
  summary: "Create product",
  security: [{ ApiToken: [] }],
  body: upsertBody,
  response: { 201: envelope(productEntity) },
};

export const updateProductSchema = {
  description: "Admin: full-replace update of a product",
  tags: ["Admin"],
  summary: "Update product",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  body: upsertBody,
  response: { 200: envelope(productEntity) },
};

export const deleteProductSchema = {
  description: "Admin: soft-delete a product",
  tags: ["Admin"],
  summary: "Delete product",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  response: { 200: envelope(z.object({ deleted: z.boolean() })) },
};
