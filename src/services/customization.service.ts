import client from "../utils/prisma";
import logger from "../utils/logger";
import defaultColors from "../data/customizationColors.json";

export interface CustomizationColorModelDTO {
  id: string;
  colorName: string;
  colorSlug: string;
  colorHex: string;
  modelImageUrl: string;
  modelBackImageUrl?: string | null;
  s3FrontKey?: string | null;
  s3BackKey?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export const FALLBACK_CUSTOMIZATION_MODELS: CustomizationColorModelDTO[] = defaultColors.map((c, i) => ({
  id: `ccm-${c.slug}`,
  colorName: c.name,
  colorSlug: c.slug,
  colorHex: c.hex,
  modelImageUrl: c.s3FrontUrl || c.frontModelUrl,
  modelBackImageUrl: c.s3BackUrl || c.backModelUrl,
  s3FrontKey: c.s3FrontKey,
  s3BackKey: c.s3BackKey,
  isActive: c.isActive !== false,
  sortOrder: i,
}));

export async function getActiveCustomizationModels(): Promise<CustomizationColorModelDTO[]> {
  try {
    const rows = await (client as any).customizationColorModel?.findMany?.({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: r.id,
        colorName: r.colorName,
        colorSlug: r.colorSlug,
        colorHex: r.colorHex,
        modelImageUrl: r.modelImageUrl,
        modelBackImageUrl: r.modelBackImageUrl,
        s3FrontKey: r.s3FrontKey,
        s3BackKey: r.s3BackKey,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
      }));
    }
  } catch (err: any) {
    logger.warn({ err: err?.message }, "Failed to fetch customizationColorModel from DB, using fallback");
  }

  return FALLBACK_CUSTOMIZATION_MODELS.filter((m) => m.isActive);
}

export async function getAllCustomizationModelsAdmin(): Promise<CustomizationColorModelDTO[]> {
  try {
    const rows = await (client as any).customizationColorModel?.findMany?.({
      orderBy: { sortOrder: "asc" },
    });

    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        id: r.id,
        colorName: r.colorName,
        colorSlug: r.colorSlug,
        colorHex: r.colorHex,
        modelImageUrl: r.modelImageUrl,
        modelBackImageUrl: r.modelBackImageUrl,
        s3FrontKey: r.s3FrontKey,
        s3BackKey: r.s3BackKey,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
      }));
    }
  } catch (err: any) {
    logger.warn({ err: err?.message }, "Failed to fetch all customizationColorModel from DB, using fallback");
  }

  return FALLBACK_CUSTOMIZATION_MODELS;
}

export async function upsertCustomizationModel(data: {
  id?: string;
  colorName: string;
  colorSlug: string;
  colorHex: string;
  modelImageUrl: string;
  modelBackImageUrl?: string | null;
  s3FrontKey?: string | null;
  s3BackKey?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<CustomizationColorModelDTO> {
  const slug = data.colorSlug || data.colorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const row = await (client as any).customizationColorModel.upsert({
    where: { colorSlug: slug },
    update: {
      colorName: data.colorName,
      colorHex: data.colorHex,
      modelImageUrl: data.modelImageUrl,
      modelBackImageUrl: data.modelBackImageUrl,
      s3FrontKey: data.s3FrontKey,
      s3BackKey: data.s3BackKey,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
    create: {
      id: data.id || `ccm-${slug}`,
      colorName: data.colorName,
      colorSlug: slug,
      colorHex: data.colorHex,
      modelImageUrl: data.modelImageUrl,
      modelBackImageUrl: data.modelBackImageUrl,
      s3FrontKey: data.s3FrontKey,
      s3BackKey: data.s3BackKey,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  return {
    id: row.id,
    colorName: row.colorName,
    colorSlug: row.colorSlug,
    colorHex: row.colorHex,
    modelImageUrl: row.modelImageUrl,
    modelBackImageUrl: row.modelBackImageUrl,
    s3FrontKey: row.s3FrontKey,
    s3BackKey: row.s3BackKey,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export async function deleteCustomizationModel(id: string): Promise<boolean> {
  try {
    await (client as any).customizationColorModel.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}
