import type { Prisma } from "@prisma/client";
import client from "../utils/prisma";

export interface PromotionDTO {
  id: string;
  name: string;
  code: string | null;
  type: "PERCENT" | "FLAT";
  value: number;
  scope: "ALL" | "PRODUCTS" | "COLLECTIONS";
  productSlugs: string[];
  collectionSlugs: string[];
  minQty: number | null;
  minOrderValue: number | null;
  startsAt: string | null;
  endsAt: string | null;
}

export type PromotionStatus = "scheduled" | "live" | "expired" | "inactive";

export interface AdminPromotionDTO extends PromotionDTO {
  isActive: boolean;
  sortOrder: number;
  status: PromotionStatus;
  createdAt: string;
}

export const promotionInclude = {
  products: { include: { product: { select: { slug: true, deletedAt: true } } } },
  collections: { include: { collection: { select: { slug: true, deletedAt: true } } } },
} satisfies Prisma.PromotionInclude;

type PromotionRow = Prisma.PromotionGetPayload<{ include: typeof promotionInclude }>;

export const promotionStatus = (
  row: Pick<PromotionRow, "isActive" | "startsAt" | "endsAt">,
  now = new Date(),
): PromotionStatus => {
  if (!row.isActive) return "inactive";
  if (row.startsAt && row.startsAt > now) return "scheduled";
  if (row.endsAt && row.endsAt < now) return "expired";
  return "live";
};

export const toPromotionDTO = (row: PromotionRow): PromotionDTO => ({
  id: row.id,
  name: row.name,
  code: row.code,
  type: row.type,
  value: row.value,
  scope: row.scope,
  productSlugs: row.products.filter((p) => !p.product.deletedAt).map((p) => p.product.slug),
  collectionSlugs: row.collections
    .filter((c) => !c.collection.deletedAt)
    .map((c) => c.collection.slug),
  minQty: row.minQty,
  minOrderValue: row.minOrderValue,
  startsAt: row.startsAt ? row.startsAt.toISOString() : null,
  endsAt: row.endsAt ? row.endsAt.toISOString() : null,
});

export const toAdminPromotionDTO = (row: PromotionRow): AdminPromotionDTO => ({
  ...toPromotionDTO(row),
  isActive: row.isActive,
  sortOrder: row.sortOrder,
  status: promotionStatus(row),
  createdAt: row.createdAt.toISOString(),
});

const liveWhere = (now: Date): Prisma.PromotionWhereInput => ({
  deletedAt: null,
  isActive: true,
  OR: [{ startsAt: null }, { startsAt: { lte: now } }],
  AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
});

export async function listPublicPromotions(now = new Date()): Promise<PromotionDTO[]> {
  const rows = await client.promotion.findMany({
    where: { ...liveWhere(now), code: null },
    include: promotionInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toPromotionDTO);
}

export async function findLiveByCode(code: string, now = new Date()): Promise<PromotionDTO | null> {
  const row = await client.promotion.findFirst({
    where: { ...liveWhere(now), code: code.trim().toUpperCase() },
    include: promotionInclude,
  });
  return row ? toPromotionDTO(row) : null;
}

export async function listAdminPromotions(): Promise<AdminPromotionDTO[]> {
  const rows = await client.promotion.findMany({
    where: { deletedAt: null },
    include: promotionInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toAdminPromotionDTO);
}

export async function getAdminPromotion(id: string): Promise<AdminPromotionDTO | null> {
  const row = await client.promotion.findFirst({
    where: { id, deletedAt: null },
    include: promotionInclude,
  });
  return row ? toAdminPromotionDTO(row) : null;
}
