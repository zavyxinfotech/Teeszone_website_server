import { z } from "zod";
import { envelope } from "../../utils/zod";

export const promotionEntity = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number(),
  scope: z.enum(["ALL", "PRODUCTS", "COLLECTIONS"]),
  productSlugs: z.array(z.string()),
  collectionSlugs: z.array(z.string()),
  minQty: z.number().nullable(),
  minOrderValue: z.number().nullable(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
});

export const adminPromotionEntity = promotionEntity.extend({
  isActive: z.boolean(),
  sortOrder: z.number(),
  status: z.enum(["scheduled", "live", "expired", "inactive"]),
  createdAt: z.string(),
});

const upsertBody = z
  .object({
    name: z.string().min(1).max(120),
    code: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((v) => {
        if (!v) return null;
        const trimmed = v.trim().toUpperCase();
        return trimmed.length > 0 ? trimmed : null;
      }),
    type: z.enum(["PERCENT", "FLAT"]),
    value: z.number().int().positive(),
    scope: z.enum(["ALL", "PRODUCTS", "COLLECTIONS"]).default("ALL"),
    productSlugs: z.array(z.string()).default([]),
    collectionSlugs: z.array(z.string()).default([]),
    minQty: z.number().int().positive().nullable().optional().transform((v) => v ?? null),
    minOrderValue: z.number().int().positive().nullable().optional().transform((v) => v ?? null),
    startsAt: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((v) => {
        if (!v) return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d.toISOString();
      }),
    endsAt: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((v) => {
        if (!v) return null;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d.toISOString();
      }),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })
  .superRefine((b, ctx) => {
    if (b.type === "PERCENT" && b.value > 90) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Percent off must be 1-90" });
    }
    if (b.scope === "PRODUCTS" && b.productSlugs.length === 0) {
      ctx.addIssue({ code: "custom", path: ["productSlugs"], message: "Pick at least one product" });
    }
    if (b.scope === "COLLECTIONS" && b.collectionSlugs.length === 0) {
      ctx.addIssue({ code: "custom", path: ["collectionSlugs"], message: "Pick at least one collection" });
    }
    if (b.startsAt && b.endsAt && new Date(b.endsAt) <= new Date(b.startsAt)) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
    }
  });

export type PromotionUpsertBody = z.infer<typeof upsertBody>;

export const listPromotionsSchema = {
  description:
    "Public: automatic promotions that are active and inside their date window (coupon-coded promotions are never listed).",
  tags: ["Promotions"],
  summary: "List live automatic promotions",
  response: { 200: envelope(z.array(promotionEntity)) },
};

export const validatePromotionSchema = {
  description: "Public: resolve a coupon code to its promotion if it is live; 404 otherwise.",
  tags: ["Promotions"],
  summary: "Validate coupon code",
  body: z.object({ code: z.string().trim().min(1).max(40) }),
  response: { 200: envelope(promotionEntity) },
};

export const adminListPromotionsSchema = {
  description: "Admin: every promotion (any status) with derived status.",
  tags: ["Admin"],
  summary: "Admin list promotions",
  security: [{ ApiToken: [] }],
  response: { 200: envelope(z.array(adminPromotionEntity)) },
};

export const adminGetPromotionSchema = {
  description: "Admin: one promotion by id.",
  tags: ["Admin"],
  summary: "Admin get promotion",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  response: { 200: envelope(adminPromotionEntity) },
};

export const createPromotionSchema = {
  description: "Admin: create a promotion (product/collection joins written in one transaction).",
  tags: ["Admin"],
  summary: "Create promotion",
  security: [{ ApiToken: [] }],
  body: upsertBody,
  response: { 201: envelope(adminPromotionEntity) },
};

export const updatePromotionSchema = {
  description: "Admin: full-replace update of a promotion.",
  tags: ["Admin"],
  summary: "Update promotion",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  body: upsertBody,
  response: { 200: envelope(adminPromotionEntity) },
};

export const deletePromotionSchema = {
  description: "Admin: soft-delete a promotion.",
  tags: ["Admin"],
  summary: "Delete promotion",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  response: { 200: envelope(z.object({ deleted: z.boolean() })) },
};
