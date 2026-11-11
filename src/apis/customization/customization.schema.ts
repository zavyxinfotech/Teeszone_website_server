import { z } from "zod";

const colorModelSchema = z.object({
  id: z.string(),
  colorName: z.string(),
  colorSlug: z.string(),
  colorHex: z.string(),
  modelImageUrl: z.string(),
  modelBackImageUrl: z.string().nullable().optional(),
  s3FrontKey: z.string().nullable().optional(),
  s3BackKey: z.string().nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

export const getCustomizationModelsSchema = {
  tags: ["Customization 3D Models"],
  summary: "Get active 3D garment customization models",
};

export const adminListCustomizationModelsSchema = {
  tags: ["Customization 3D Models"],
  summary: "Admin: list all 3D garment customization models",
};

export const adminUpsertCustomizationModelSchema = {
  tags: ["Customization 3D Models"],
  summary: "Admin: upsert 3D garment customization model",
  body: z.object({
    id: z.string().optional(),
    colorName: z.string().min(1),
    colorSlug: z.string().optional(),
    colorHex: z.string().min(1),
    modelImageUrl: z.string().min(1),
    modelBackImageUrl: z.string().nullable().optional(),
    s3FrontKey: z.string().nullable().optional(),
    s3BackKey: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
};

export const adminDeleteCustomizationModelSchema = {
  tags: ["Customization 3D Models"],
  summary: "Admin: delete 3D garment customization model",
  params: z.object({
    id: z.string(),
  }),
};

export const adminUpload3DModelSchema = {
  tags: ["Customization 3D Models"],
  summary: "Admin: upload 3D model PNG to S3",
};
