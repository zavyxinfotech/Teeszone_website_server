import { Selectable } from "kysely";
import { Product as ProductTable } from "../../kysely/types";
import { db } from "../utils/kysely";
import client from "../utils/prisma";

export interface ProductColorModelDTO {
  id: string;
  productId: string;
  productColorId?: string | null;
  colorName: string;
  colorHex: string;
  modelImageUrl: string;
  modelBackImageUrl?: string | null;
  s3ObjectKey?: string | null;
  isActive: boolean;
}

export interface ProductDTO {
  id: string;
  name: string;
  slug: string;
  collections: string[];
  description: string;
  fit: string;
  fabric: string;
  gsm: number;
  mrp: number;
  price: number;
  colors: {
    name: string;
    hex: string;
    image: string;
    backImage?: string | null;
    chestImage?: string | null;
    detailImage?: string | null;
    image4?: string | null;
    image5?: string | null;
  }[];
  colorModels?: ProductColorModelDTO[];
  sizes: string[];
  qtyDiscounts: { minQty: number; offPct: number }[];
  features: string[];
  isNew: boolean;
  bestSeller: boolean;
  megaSale: boolean;
  ordersDelivered?: number;
  sizeChartImage?: string | null;
}

export const DEFAULT_AEROSOFT_3D_MODELS: ProductColorModelDTO[] = [
  {
    id: "pcm-aerosoft-black",
    productId: "p-aerosoft-polo-200",
    colorName: "Black",
    colorHex: "#26282D",
    modelImageUrl: "/products/polo-black-front-3d.png",
    modelBackImageUrl: "/products/polo-black-back-3d.png",
    s3ObjectKey: "products/aerosoft-polo-200/3d-models/black/front.png",
    isActive: true,
  },
  {
    id: "pcm-aerosoft-white",
    productId: "p-aerosoft-polo-200",
    colorName: "White",
    colorHex: "#FFFFFF",
    modelImageUrl: "/products/polo-white-front-3d.png",
    modelBackImageUrl: "/products/polo-white-back-3d.png",
    s3ObjectKey: "products/aerosoft-polo-200/3d-models/white/front.png",
    isActive: true,
  },
  {
    id: "pcm-aerosoft-true-navy",
    productId: "p-aerosoft-polo-200",
    colorName: "True Navy",
    colorHex: "#3F5277",
    modelImageUrl: "/products/polo-true-navy-front-3d.png",
    modelBackImageUrl: "/products/polo-true-navy-back-3d.png",
    s3ObjectKey: "products/aerosoft-polo-200/3d-models/true-navy/front.png",
    isActive: true,
  },
  {
    id: "pcm-aerosoft-light-grey",
    productId: "p-aerosoft-polo-200",
    colorName: "Light Grey Melange",
    colorHex: "#CCCAC9",
    modelImageUrl: "/products/polo-light-grey-front-3d.png",
    modelBackImageUrl: "/products/polo-light-grey-back-3d.png",
    s3ObjectKey: "products/aerosoft-polo-200/3d-models/light-grey-melange/front.png",
    isActive: true,
  },
];

export interface CollectionDTO {
  slug: string;
  name: string;
  segment: string;
  group: string;
  description: string;
}

export interface SegmentDTO {
  slug: string;
  name: string;
  groups: { title: string; collections: string[] }[];
}

export interface FabricDTO {
  key: string;
  name: string;
  description: string;
  fit: string;
  highlights: string[];
  image: string;
}

export interface ReviewDTO {
  stars: number;
  quote: string;
  author: string;
  product: string;
  image?: string;
  customerImage?: string;
  verified?: boolean;
}

type ProductRow = Selectable<ProductTable>;

const VIRTUAL_FLAG_BY_SLUG = {
  "new-arrival": "isNew",
  "best-sellers": "bestSeller",
  "mega-sale": "megaSale",
} as const;

export type VirtualSlug = keyof typeof VIRTUAL_FLAG_BY_SLUG;

export const isVirtualSlug = (slug: string): slug is VirtualSlug =>
  slug in VIRTUAL_FLAG_BY_SLUG;

// ---------- Products ----------

async function hydrateProducts(rows: ProductRow[]): Promise<ProductDTO[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const colors = await db
    .selectFrom("ProductColor")
    .select(["productId", "name", "hex", "image", "backImage", "chestImage", "detailImage", "image4", "image5"])
    .where("productId", "in", ids)
    .where("deletedAt", "is", null)
    .orderBy("sortOrder", "asc")
    .orderBy("id", "asc")
    .execute();

  const tiers = await db
    .selectFrom("ProductQtyDiscount")
    .select(["productId", "minQty", "offPct"])
    .where("productId", "in", ids)
    .orderBy("minQty", "asc")
    .execute();

  const joins = await db
    .selectFrom("ProductCollection")
    .innerJoin("Collection", "Collection.id", "ProductCollection.collectionId")
    .select(["ProductCollection.productId as productId", "Collection.slug as slug"])
    .where("ProductCollection.productId", "in", ids)
    .where("Collection.deletedAt", "is", null)
    .orderBy("ProductCollection.sortOrder", "asc")
    .execute();

  const colorsBy = new Map<string, { name: string; hex: string; image: string; backImage?: string | null; chestImage?: string | null; detailImage?: string | null; image4?: string | null; image5?: string | null }[]>();
  for (const c of colors) {
    const list = colorsBy.get(c.productId) ?? [];
    list.push({
      name: c.name,
      hex: c.hex,
      image: c.image,
      backImage: c.backImage,
      chestImage: c.chestImage,
      detailImage: c.detailImage,
      image4: c.image4,
      image5: c.image5,
    });
    colorsBy.set(c.productId, list);
  }
  const tiersBy = new Map<string, { minQty: number; offPct: number }[]>();
  for (const t of tiers) {
    const list = tiersBy.get(t.productId) ?? [];
    list.push({ minQty: t.minQty, offPct: t.offPct });
    tiersBy.set(t.productId, list);
  }
  const slugsBy = new Map<string, string[]>();
  for (const j of joins) {
    const list = slugsBy.get(j.productId) ?? [];
    list.push(j.slug);
    slugsBy.set(j.productId, list);
  }

  return rows.map((row) => {
    const isNew = Boolean(row.isNew);
    const bestSeller = Boolean(row.bestSeller);
    const megaSale = Boolean(row.megaSale);
    const collections = [...(slugsBy.get(row.id) ?? [])];
    if (isNew) collections.push("new-arrival");
    if (bestSeller) collections.push("best-sellers");
    if (megaSale) collections.push("mega-sale");

    const rawName = row.name || "";
    const name = rawName.startsWith("Customized ") ? rawName : `Customized ${rawName}`;

    let price = row.price;
    let mrp = row.mrp;
    if (row.slug === "aerosoft-polo-200") {
      price = 830;
      mrp = 1999;
    } else if (row.slug === "mens-polo-half-sleeve-240") {
      price = 925;
      mrp = 2399;
    } else if (row.slug === "ecoblend-polo-neck-240") {
      price = 975;
      mrp = 1199;
    }

    return {
      id: row.id,
      name,
      slug: row.slug,
      collections,
      description: row.description,
      fit: row.fit,
      fabric: row.fabric,
      gsm: row.gsm,
      mrp,
      price,
      colors: colorsBy.get(row.id) ?? [],
      colorModels: row.slug === "aerosoft-polo-200" ? DEFAULT_AEROSOFT_3D_MODELS : [],
      sizes: (row.sizes as unknown as string[]) ?? [],
      qtyDiscounts: tiersBy.get(row.id) ?? [],
      features: (row.features as unknown as string[]) ?? [],
      isNew,
      bestSeller,
      megaSale,
      ordersDelivered: (row as any).ordersDelivered != null ? Number((row as any).ordersDelivered) : 850,
      sizeChartImage: (row as any).sizeChartImage ?? null,
    };
  });
}

export async function listProducts(opts: {
  collection?: string;
  includeInactive?: boolean;
} = {}): Promise<ProductDTO[]> {
  let query = db
    .selectFrom("Product")
    .selectAll()
    .where("deletedAt", "is", null)
    .orderBy("sortOrder", "asc")
    .orderBy("id", "asc");

  if (!opts.includeInactive) {
    query = query.where("isActive", "=", 1);
  }

  if (opts.collection) {
    if (isVirtualSlug(opts.collection)) {
      query = query.where(VIRTUAL_FLAG_BY_SLUG[opts.collection], "=", 1);
    } else {
      const collection = await db
        .selectFrom("Collection")
        .select(["id"])
        .where("slug", "=", opts.collection)
        .where("deletedAt", "is", null)
        .executeTakeFirst();
      if (!collection) return [];
      query = query.where("id", "in", (eb) =>
        eb
          .selectFrom("ProductCollection")
          .select("ProductCollection.productId")
          .where("ProductCollection.collectionId", "=", collection.id),
      );
    }
  }

  const rows = await query.execute();
  return hydrateProducts(rows);
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const row = await db
    .selectFrom("Product")
    .selectAll()
    .where("slug", "=", slug)
    .where("deletedAt", "is", null)
    .where("isActive", "=", 1)
    .executeTakeFirst();
  if (!row) return null;
  const [dto] = await hydrateProducts([row]);
  return dto ?? null;
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  const row = await db
    .selectFrom("Product")
    .selectAll()
    .where("id", "=", id)
    .where("deletedAt", "is", null)
    .executeTakeFirst();
  if (!row) return null;
  const [dto] = await hydrateProducts([row]);
  return dto ?? null;
}

// ---------- Collections & navigation ----------

export async function listCollections(): Promise<CollectionDTO[]> {
  const rows = await db
    .selectFrom("Collection")
    .innerJoin("Segment", "Segment.id", "Collection.segmentId")
    .innerJoin("SegmentGroup", "SegmentGroup.id", "Collection.groupId")
    .select([
      "Collection.slug as slug",
      "Collection.name as name",
      "Collection.description as description",
      "Segment.slug as segmentSlug",
      "SegmentGroup.title as groupTitle",
    ])
    .where("Collection.deletedAt", "is", null)
    .orderBy("Segment.sortOrder", "asc")
    .orderBy("SegmentGroup.sortOrder", "asc")
    .orderBy("Collection.sortOrder", "asc")
    .execute();

  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    segment: r.segmentSlug,
    group: r.groupTitle,
    description: r.description,
  }));
}

export async function getCollectionBySlug(slug: string): Promise<CollectionDTO | null> {
  const row = await db
    .selectFrom("Collection")
    .innerJoin("Segment", "Segment.id", "Collection.segmentId")
    .innerJoin("SegmentGroup", "SegmentGroup.id", "Collection.groupId")
    .select([
      "Collection.slug as slug",
      "Collection.name as name",
      "Collection.description as description",
      "Segment.slug as segmentSlug",
      "SegmentGroup.title as groupTitle",
    ])
    .where("Collection.slug", "=", slug)
    .where("Collection.deletedAt", "is", null)
    .executeTakeFirst();
  if (!row) return null;
  return {
    slug: row.slug,
    name: row.name,
    segment: row.segmentSlug,
    group: row.groupTitle,
    description: row.description,
  };
}

export async function listNavSegments(): Promise<SegmentDTO[]> {
  const segments = await db
    .selectFrom("Segment")
    .select(["id", "slug", "name"])
    .where("deletedAt", "is", null)
    .where("isNav", "=", 1)
    .orderBy("sortOrder", "asc")
    .execute();

  if (segments.length === 0) return [];
  const segmentIds = segments.map((s) => s.id);

  const groups = await db
    .selectFrom("SegmentGroup")
    .select(["id", "segmentId", "title"])
    .where("segmentId", "in", segmentIds)
    .where("deletedAt", "is", null)
    .orderBy("sortOrder", "asc")
    .execute();

  const groupIds = groups.map((g) => g.id);
  const collections = groupIds.length
    ? await db
        .selectFrom("Collection")
        .select(["groupId", "slug"])
        .where("groupId", "in", groupIds)
        .where("deletedAt", "is", null)
        .orderBy("sortOrder", "asc")
        .execute()
    : [];

  const collectionsByGroup = new Map<string, string[]>();
  for (const c of collections) {
    const list = collectionsByGroup.get(c.groupId) ?? [];
    list.push(c.slug);
    collectionsByGroup.set(c.groupId, list);
  }

  return segments.map((seg) => ({
    slug: seg.slug,
    name: seg.name,
    groups: groups
      .filter((g) => g.segmentId === seg.id)
      .map((g) => ({
        title: g.title,
        collections: collectionsByGroup.get(g.id) ?? [],
      })),
  }));
}

// ---------- Fabrics & reviews ----------

export async function listFabrics(): Promise<FabricDTO[]> {
  const rows = await db
    .selectFrom("Fabric")
    .selectAll()
    .where("deletedAt", "is", null)
    .orderBy("sortOrder", "asc")
    .orderBy("id", "asc")
    .execute();
  return rows.map((r) => ({
    key: r.key,
    name: r.name,
    description: r.description,
    fit: r.fit,
    highlights: (r.highlights as unknown as string[]) ?? [],
    image: r.image,
  }));
}

export async function listReviews(): Promise<ReviewDTO[]> {
  const rows = await db
    .selectFrom("Review")
    .selectAll()
    .where("deletedAt", "is", null)
    .where("isPublished", "=", 1)
    .orderBy("sortOrder", "asc")
    .orderBy("id", "asc")
    .execute();
  return rows.map((r: any) => ({
    stars: r.stars,
    quote: r.quote,
    author: r.author,
    product: r.productName,
    image: r.customerImage || r.productImage || undefined,
    customerImage: r.customerImage || undefined,
    verified: true,
  }));
}

// ---------- 3D Garment Models ----------

export async function getColorModels(slug: string): Promise<ProductColorModelDTO[]> {
  try {
    const product = await db
      .selectFrom("Product")
      .select(["id", "slug"])
      .where("slug", "=", slug)
      .where("deletedAt", "is", null)
      .executeTakeFirst();
    if (!product) return [];

    const models = await (client as any).productColorModel?.findMany?.({
      where: { productId: product.id, isActive: true },
    });

    if (models && models.length > 0) {
      return models.map((m: any) => ({
        id: m.id,
        productId: m.productId,
        productColorId: m.productColorId,
        colorName: m.colorName,
        colorHex: m.colorHex,
        modelImageUrl: m.modelImageUrl,
        modelBackImageUrl: m.modelBackImageUrl,
        s3ObjectKey: m.s3ObjectKey,
        isActive: m.isActive,
      }));
    }
  } catch {
    // Fallback to defaults
  }

  if (slug === "aerosoft-polo-200" || slug.includes("polo")) {
    return DEFAULT_AEROSOFT_3D_MODELS;
  }
  return [];
}

export async function upsertColorModel(data: {
  slug: string;
  colorName: string;
  colorHex: string;
  modelImageUrl: string;
  modelBackImageUrl?: string | null;
  s3ObjectKey?: string | null;
  isActive?: boolean;
}): Promise<ProductColorModelDTO> {
  const product = await db
    .selectFrom("Product")
    .select(["id", "slug"])
    .where("slug", "=", data.slug)
    .where("deletedAt", "is", null)
    .executeTakeFirst();
  if (!product) throw new Error("Product not found");

  const row = await (client as any).productColorModel.upsert({
    where: {
      productId_colorName: {
        productId: product.id,
        colorName: data.colorName,
      },
    },
    update: {
      colorHex: data.colorHex,
      modelImageUrl: data.modelImageUrl,
      modelBackImageUrl: data.modelBackImageUrl,
      s3ObjectKey: data.s3ObjectKey,
      isActive: data.isActive ?? true,
    },
    create: {
      productId: product.id,
      colorName: data.colorName,
      colorHex: data.colorHex,
      modelImageUrl: data.modelImageUrl,
      modelBackImageUrl: data.modelBackImageUrl,
      s3ObjectKey: data.s3ObjectKey,
      isActive: data.isActive ?? true,
    },
  });

  return {
    id: row.id,
    productId: row.productId,
    productColorId: row.productColorId,
    colorName: row.colorName,
    colorHex: row.colorHex,
    modelImageUrl: row.modelImageUrl,
    modelBackImageUrl: row.modelBackImageUrl,
    s3ObjectKey: row.s3ObjectKey,
    isActive: row.isActive,
  };
}
