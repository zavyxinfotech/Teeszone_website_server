import { fabrics } from "../../../frontend/src/data/fabrics";
import { collections, segments } from "../../../frontend/src/data/navigation";
import { products } from "../../../frontend/src/data/products";
import { reviews } from "../../../frontend/src/data/reviews";
import client from "../src/utils/prisma";

const VIRTUAL_SLUGS = ["new-arrival", "best-sellers", "mega-sale"] as const;

async function main() {
  // segments
  const segmentIdBySlug = new Map<string, string>();
  for (const [i, seg] of segments.entries()) {
    const row = await client.segment.upsert({
      where: { slug: seg.slug },
      update: { name: seg.name, isNav: true, sortOrder: i, deletedAt: null },
      create: { slug: seg.slug, name: seg.name, isNav: true, sortOrder: i },
    });
    segmentIdBySlug.set(seg.slug, row.id);
  }
  const shopMore = await client.segment.upsert({
    where: { slug: "shop-more" },
    update: { name: "Shop More", isNav: false, sortOrder: 99, deletedAt: null },
    create: { slug: "shop-more", name: "Shop More", isNav: false, sortOrder: 99 },
  });
  segmentIdBySlug.set("shop-more", shopMore.id);

  // groups
  const groupIdByKey = new Map<string, string>();
  for (const seg of segments) {
    const segmentId = segmentIdBySlug.get(seg.slug)!;
    for (const [gi, group] of seg.groups.entries()) {
      const row = await client.segmentGroup.upsert({
        where: { segmentId_title: { segmentId, title: group.title } },
        update: { sortOrder: gi, deletedAt: null },
        create: { segmentId, title: group.title, sortOrder: gi },
      });
      groupIdByKey.set(`${seg.slug}|${group.title}`, row.id);
    }
  }
  const shopMoreGroup = await client.segmentGroup.upsert({
    where: { segmentId_title: { segmentId: shopMore.id, title: "Shop More" } },
    update: { sortOrder: 0, deletedAt: null },
    create: { segmentId: shopMore.id, title: "Shop More", sortOrder: 0 },
  });
  groupIdByKey.set("shop-more|Shop More", shopMoreGroup.id);

  // collections
  const orderBySlug = new Map<string, number>();
  for (const seg of segments) {
    for (const group of seg.groups) {
      group.collections.forEach((slug, i) => orderBySlug.set(slug, i));
    }
  }
  collections
    .filter((c) => c.segment === "shop-more")
    .forEach((c, i) => orderBySlug.set(c.slug, i));

  const collectionIdBySlug = new Map<string, string>();
  for (const col of collections) {
    const segmentId = segmentIdBySlug.get(col.segment);
    const groupId = groupIdByKey.get(`${col.segment}|${col.group}`);
    if (!segmentId || !groupId) {
      console.warn(`SKIP collection ${col.slug}: unknown segment/group ${col.segment}/${col.group}`);
      continue;
    }
    const isVirtual = (VIRTUAL_SLUGS as readonly string[]).includes(col.slug);
    const row = await client.collection.upsert({
      where: { slug: col.slug },
      update: {
        name: col.name,
        description: col.description,
        isVirtual,
        segmentId,
        groupId,
        sortOrder: orderBySlug.get(col.slug) ?? 0,
        deletedAt: null,
      },
      create: {
        slug: col.slug,
        name: col.name,
        description: col.description,
        isVirtual,
        segmentId,
        groupId,
        sortOrder: orderBySlug.get(col.slug) ?? 0,
      },
    });
    collectionIdBySlug.set(col.slug, row.id);
  }

  // products
  for (const [pi, p] of products.entries()) {
    const memberships = {
      isNew: p.collections.includes("new-arrival"),
      bestSeller: p.collections.includes("best-sellers"),
      megaSale: p.collections.includes("mega-sale"),
    };
    const flags = {
      isNew: !!p.isNew || memberships.isNew,
      bestSeller: !!p.bestSeller || memberships.bestSeller,
      megaSale: !!p.megaSale || memberships.megaSale,
    };
    for (const key of ["isNew", "bestSeller", "megaSale"] as const) {
      const flagged = key === "isNew" ? !!p.isNew : key === "bestSeller" ? !!p.bestSeller : !!p.megaSale;
      if (flagged !== memberships[key]) {
        console.warn(`FLAG MISMATCH ${p.slug}: ${key} flag=${flagged} membership=${memberships[key]} — seeding as true`);
      }
    }

    const base = {
      name: p.name,
      description: p.description,
      fit: p.fit,
      fabric: p.fabric,
      gsm: p.gsm,
      mrp: p.mrp,
      price: p.price,
      sizes: p.sizes,
      features: p.features,
      ...flags,
      isActive: true,
      sortOrder: pi,
    };
    const row = await client.product.upsert({
      where: { slug: p.slug },
      update: { ...base, deletedAt: null },
      create: { id: p.id, slug: p.slug, ...base },
    });

    await client.productColor.deleteMany({ where: { productId: row.id } });
    await client.productColor.createMany({
      data: p.colors.map((c, i) => ({
        productId: row.id,
        name: c.name,
        hex: c.hex,
        image: c.image,
        sortOrder: i,
      })),
    });

    await client.productQtyDiscount.deleteMany({ where: { productId: row.id } });
    await client.productQtyDiscount.createMany({
      data: p.qtyDiscounts.map((t) => ({
        productId: row.id,
        minQty: t.minQty,
        offPct: t.offPct,
      })),
    });

    const realSlugs = p.collections.filter((s) => !(VIRTUAL_SLUGS as readonly string[]).includes(s));
    await client.productCollection.deleteMany({ where: { productId: row.id } });
    for (const [ci, slug] of realSlugs.entries()) {
      const collectionId = collectionIdBySlug.get(slug);
      if (!collectionId) {
        console.warn(`SKIP join ${p.slug} -> ${slug}: unknown collection`);
        continue;
      }
      await client.productCollection.create({
        data: { productId: row.id, collectionId, sortOrder: ci },
      });
    }
  }

  // fabrics
  for (const [i, f] of fabrics.entries()) {
    await client.fabric.upsert({
      where: { key: f.key },
      update: {
        name: f.name,
        description: f.description,
        fit: f.fit,
        highlights: f.highlights,
        image: f.image,
        sortOrder: i,
        deletedAt: null,
      },
      create: {
        key: f.key,
        name: f.name,
        description: f.description,
        fit: f.fit,
        highlights: f.highlights,
        image: f.image,
        sortOrder: i,
      },
    });
  }

  // reviews
  for (const [i, r] of reviews.entries()) {
    const id = `seed-review-${i}`;
    await client.review.upsert({
      where: { id },
      update: {
        stars: r.stars,
        quote: r.quote,
        author: r.author,
        productName: r.product,
        isPublished: true,
        sortOrder: i,
        deletedAt: null,
      },
      create: {
        id,
        stars: r.stars,
        quote: r.quote,
        author: r.author,
        productName: r.product,
        isPublished: true,
        sortOrder: i,
      },
    });
  }

  // summary
  const counts = {
    segments: await client.segment.count(),
    groups: await client.segmentGroup.count(),
    collections: await client.collection.count(),
    products: await client.product.count(),
    colors: await client.productColor.count(),
    qtyDiscounts: await client.productQtyDiscount.count(),
    productCollections: await client.productCollection.count(),
    fabrics: await client.fabric.count(),
    reviews: await client.review.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .then(async () => {
    await client.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await client.$disconnect();
    process.exit(1);
  });
