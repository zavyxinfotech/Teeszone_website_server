import { z } from "zod";

export const saveCustomDesignSchema = {
  body: z.object({
    productId: z.string().optional().nullable(),
    productSlug: z.string(),
    productName: z.string(),
    colorName: z.string(),
    colorHex: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    logoName: z.string().optional().nullable(),
    frontLogoUrl: z.string().optional().nullable(),
    backLogoUrl: z.string().optional().nullable(),
    frontPreviewUrl: z.string().optional().nullable(),
    backPreviewUrl: z.string().optional().nullable(),
    frontPositionPreset: z.string().optional().nullable(),
    backPositionPreset: z.string().optional().nullable(),
    printLocation: z.string().optional().nullable(),
    printType: z.string().optional().nullable(),
    frontElements: z.any().optional().nullable(),
    backElements: z.any().optional().nullable(),
    customizationData: z.any().optional().nullable(),
    embroideryNotes: z.string().optional().nullable(),
  }),
};
