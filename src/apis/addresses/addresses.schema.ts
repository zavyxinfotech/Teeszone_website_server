import { z } from "zod";
import { envelope } from "../../utils/zod";

const addressShape = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  type: z.enum(["HOME", "WORK", "OTHER"]),
  isDefault: z.boolean(),
});

const addressBody = z.object({
  fullName: z.string().min(2).max(80),
  phone: z.string().min(8).max(20),
  line1: z.string().min(3).max(160),
  line2: z.string().max(160).optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
  type: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
  isDefault: z.boolean().default(false),
});

export const listAddressesSchema = {
  description: "Current user's saved addresses (default first).",
  tags: ["Addresses"],
  summary: "List addresses",
  security: [{ bearerAuth: [] }],
  response: { 200: envelope(z.array(addressShape)) },
};

export const createAddressSchema = {
  description: "Add an address (max 10). The first address becomes the default automatically.",
  tags: ["Addresses"],
  summary: "Add address",
  security: [{ bearerAuth: [] }],
  body: addressBody,
  response: { 201: envelope(addressShape) },
};

export const updateAddressSchema = {
  description: "Update an address; isDefault: true makes it the default.",
  tags: ["Addresses"],
  summary: "Update address",
  security: [{ bearerAuth: [] }],
  params: z.object({ id: z.string() }),
  body: addressBody,
  response: { 200: envelope(addressShape) },
};

export const deleteAddressSchema = {
  description: "Remove an address. If it was the default, the most recent remaining one is promoted.",
  tags: ["Addresses"],
  summary: "Delete address",
  security: [{ bearerAuth: [] }],
  params: z.object({ id: z.string() }),
  response: { 200: envelope(z.object({ deleted: z.boolean() })) },
};
