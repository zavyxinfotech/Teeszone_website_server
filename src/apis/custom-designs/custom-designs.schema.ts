import { z } from "zod";

export const saveCustomDesignSchema = {
  body: z.object({
    productSlug: z.string(),
    productName: z.string(),
    colorName: z.string(),
    colorHex: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    logoName: z.string().optional().nullable(),
    frontPreviewUrl: z.string().optional().nullable(),
    backPreviewUrl: z.string().optional().nullable(),
    printLocation: z.string().optional().nullable(),
    embroideryNotes: z.string().optional().nullable(),
  }),
};
