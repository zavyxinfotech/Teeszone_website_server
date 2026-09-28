import { z } from "zod";
import { envelope } from "../../utils/zod";

export const fabricEntity = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  fit: z.string(),
  highlights: z.array(z.string()),
  image: z.string(),
});

const upsertBody = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "key must be kebab-case"),
  name: z.string().min(1),
  description: z.string().min(1),
  fit: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  image: z.string().min(1),
  sortOrder: z.number().int().default(0),
});

export const adminFabricEntity = fabricEntity.extend({ id: z.string(), sortOrder: z.number() });

export const adminListFabricsSchema = {
  description: "Admin: all fabrics with ids and positions",
  tags: ["Admin"],
  summary: "Admin list fabrics",
  security: [{ ApiToken: [] }],
  response: { 200: envelope(z.array(adminFabricEntity)) },
};

export const listFabricsSchema = {
  description: "List all fabrics (ordered)",
  tags: ["Catalog"],
  summary: "List fabrics",
  response: { 200: envelope(z.array(fabricEntity)) },
};

export const createFabricSchema = {
  description: "Admin: create a fabric",
  tags: ["Admin"],
  summary: "Create fabric",
  security: [{ ApiToken: [] }],
  body: upsertBody,
  response: { 201: envelope(fabricEntity) },
};

export const updateFabricSchema = {
  description: "Admin: update a fabric",
  tags: ["Admin"],
  summary: "Update fabric",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  body: upsertBody,
  response: { 200: envelope(fabricEntity) },
};

export const deleteFabricSchema = {
  description: "Admin: soft-delete a fabric",
  tags: ["Admin"],
  summary: "Delete fabric",
  security: [{ ApiToken: [] }],
  params: z.object({ id: z.string() }),
  response: { 200: envelope(z.object({ deleted: z.boolean() })) },
};
