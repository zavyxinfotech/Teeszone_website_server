import { z } from "zod";

export const toggleLikeBody = z.object({
  productSlug: z.string().min(1, "Product slug is required"),
  productName: z.string().optional(),
});

export const toggleLikeSchema = {
  tags: ["Likes"],
  summary: "Toggle a product like for current authenticated user",
  body: toggleLikeBody,
};

export const getMyLikesSchema = {
  tags: ["Likes"],
  summary: "Get liked product slugs for current authenticated user",
};

export const adminListLikesSchema = {
  tags: ["Likes"],
  summary: "List all product likes with user details (Admin only)",
};
