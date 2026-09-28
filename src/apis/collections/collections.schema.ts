import { z } from "zod";
import { envelope } from "../../utils/zod";
import { collectionEntity } from "../navigation/navigation.schema";

const upsertBody = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string().default(""),
  segment: z.string().min(1), // segment slug
  group: z.string().min(1), // group title
  sortOrder: z.number().int().default(0),
});

export const adminCollectionEntity = collectionEntity.extend({
  id: z.string(),
  isVirtual: z.boolean(),
  sortOrder: z.number(),
  productCount: z.number(),
});

export const adminListCollectionsSchema = {
  description: "Admin: all collections with ids, virtual flag, position and product counts",
  tags: ["Admin"],
  summary: "Admin list collections",
  security: [{ ApiToken: [] }],
  response: { 200: envelope(z.array(adminCollectionEntity)) },
};

export const listCollectionsSchema = {
  description: "List all collections (ordered by segment, group, position)",
  tags: ["Catalog"],
  summary: "List collections",
  response: { 200: envelope(z.array(collectionEntity)) },
};

export const getCollectionSchema = {
  description: "Get one collection by slug",
  tags: ["Catalog"],
  summary: "Get collection",
  params: z.object({ slug: z.string() }),
  response: { 200: envelope(collectionEntity) },
};

export const createCollectionSchema = {
  description: "Admin: create a collection",
  tags: ["Admin"],
  summary: "Create collection",
  security: [{ ApiToken: [] }],
  body: upsertBody,
  response: { 201: envelope(collectionEntity) },
};

export const updateCollectionSchema = {
  description: "Admin: update a collection",
  tags: ["Admin"],
  summary: "Update collection",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  body: upsertBody,
  response: { 200: envelope(collectionEntity) },
};

export const deleteCollectionSchema = {
  description: "Admin: soft-delete a collection (join rows keep history; products lose the slug in their collections[])",
  tags: ["Admin"],
  summary: "Delete collection",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  response: { 200: envelope(z.object({ deleted: z.boolean() })) },
};
