import { z } from "zod";
import { envelope } from "../../utils/zod";

export const reviewEntity = z.object({
  stars: z.number(),
  quote: z.string(),
  author: z.string(),
  product: z.string(),
});

export const adminReviewEntity = reviewEntity.extend({
  id: z.string(),
  isPublished: z.boolean(),
  sortOrder: z.number(),
});

const upsertBody = z.object({
  stars: z.number().int().min(1).max(5),
  quote: z.string().min(1),
  author: z.string().min(1),
  product: z.string().min(1),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const listReviewsSchema = {
  description: "List published reviews (ordered)",
  tags: ["Catalog"],
  summary: "List reviews",
  response: { 200: envelope(z.array(reviewEntity)) },
};

export const adminListReviewsSchema = {
  description: "Admin: list all reviews including unpublished",
  tags: ["Admin"],
  summary: "Admin list reviews",
  security: [{ ApiToken: [] }],
  response: { 200: envelope(z.array(adminReviewEntity)) },
};

export const createReviewSchema = {
  description: "Admin: create a review",
  tags: ["Admin"],
  summary: "Create review",
  security: [{ ApiToken: [] }],
  body: upsertBody,
  response: { 201: envelope(adminReviewEntity) },
};

export const updateReviewSchema = {
  description: "Admin: update a review (including publish/unpublish)",
  tags: ["Admin"],
  summary: "Update review",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  body: upsertBody,
  response: { 200: envelope(adminReviewEntity) },
};

export const deleteReviewSchema = {
  description: "Admin: soft-delete a review",
  tags: ["Admin"],
  summary: "Delete review",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  response: { 200: envelope(z.object({ deleted: z.boolean() })) },
};
