import { z } from "zod";

export const cartItemSchema = z.object({
  key: z.string(),
  slug: z.string(),
  name: z.string(),
  image: z.string(),
  colorName: z.string(),
  colorHex: z.string(),
  size: z.string(),
  qty: z.number().int().min(1).max(9999),
  customNote: z.string().optional().nullable(),
});

export const syncCartSchema = {
  body: z.object({
    items: z.array(cartItemSchema),
    note: z.string().optional().nullable(),
  }),
};

export const updateQtySchema = {
  body: z.object({
    key: z.string(),
    qty: z.number().int().min(0).max(9999),
  }),
};

export const removeItemSchema = {
  body: z.object({
    key: z.string(),
  }),
};
