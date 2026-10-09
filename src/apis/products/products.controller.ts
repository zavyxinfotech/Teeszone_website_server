import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { BadRequestException } from "../../exception/badrequest.exception";
import { NotFoundException } from "../../exception/notfound.exception";
import { cacheGet, cacheInvalidate, cacheSet } from "../../services/cache.service";
import { deleteS3Objects } from "../../services/s3.service";
import {
  getProductById,
  getProductBySlug,
  isVirtualSlug,
  listProducts,
  ProductDTO,
} from "../../services/catalog.service";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

type UpsertBody = {
  name: string;
  slug: string;
  description: string;
  fit: string;
  fabric: string;
  gsm: number;
  mrp: number;
  price: number;
  sizes: string[];
  features: string[];
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
  qtyDiscounts: { minQty: number; offPct: number }[];
  collections: string[];
  isNew: boolean;
  bestSeller: boolean;
  megaSale: boolean;
  isActive: boolean;
  sortOrder: number;
};

async function writeProduct(body: UpsertBody, existingId?: string): Promise<string> {
  const virtual = body.collections.filter((slug) => isVirtualSlug(slug));
  if (virtual.length > 0) {
    throw new BadRequestException({
      message: `Virtual collections cannot be assigned directly: ${virtual.join(", ")}`,
      description: "Set the isNew / bestSeller / megaSale flags instead.",
    });
  }

  const collectionRows = await client.collection.findMany({
    where: { slug: { in: body.collections }, deletedAt: null },
    select: { id: true, slug: true, isVirtual: true },
  });
  const foundBySlug = new Map(collectionRows.map((c) => [c.slug, c]));
  const missing = body.collections.filter((slug) => !foundBySlug.has(slug));
  if (missing.length > 0) {
    throw new BadRequestException({
      message: `Unknown collections: ${missing.join(", ")}`,
      description: "Create the collection first or fix the slug.",
    });
  }

  let oldImages: string[] = [];
  if (existingId) {
    const oldColors = await client.productColor.findMany({
      where: { productId: existingId },
      select: { image: true, backImage: true, chestImage: true, detailImage: true, image4: true, image5: true },
    });
    oldImages = oldColors.flatMap((c) => [c.image, c.backImage, c.chestImage, c.detailImage, c.image4, c.image5]).filter((img): img is string => Boolean(img));
  }

  const base = {
    name: body.name,
    slug: body.slug,
    description: body.description,
    fit: body.fit,
    fabric: body.fabric,
    gsm: body.gsm,
    mrp: body.mrp,
    price: body.price,
    sizes: body.sizes,
    features: body.features,
    isNew: body.isNew,
    bestSeller: body.bestSeller,
    megaSale: body.megaSale,
    isActive: body.isActive,
    sortOrder: body.sortOrder,
  };

  const productId = await client.$transaction(async (tx) => {
    let pId = existingId;
    if (pId) {
      await tx.product.update({ where: { id: pId }, data: base });
    } else {
      const created = await tx.product.create({ data: base });
      pId = created.id;
    }
    await tx.productColor.deleteMany({ where: { productId: pId } });
    await tx.productColor.createMany({
      data: body.colors.map((c, i) => ({
        productId: pId!,
        name: c.name,
        hex: c.hex,
        image: c.image,
        backImage: c.backImage || null,
        chestImage: c.chestImage || null,
        detailImage: c.detailImage || null,
        image4: c.image4 || null,
        image5: c.image5 || null,
        sortOrder: i,
      })),
    });
    await tx.productQtyDiscount.deleteMany({ where: { productId: pId } });
    await tx.productQtyDiscount.createMany({
      data: body.qtyDiscounts.map((t) => ({ productId: pId!, ...t })),
    });
    await tx.productCollection.deleteMany({ where: { productId: pId } });
    await tx.productCollection.createMany({
      data: body.collections.map((slug, i) => ({
        productId: pId!,
        collectionId: foundBySlug.get(slug)!.id,
        sortOrder: i,
      })),
    });
    return pId!;
  });

  if (oldImages.length > 0) {
    const newImages = new Set(body.colors.flatMap((c) => [c.image, c.backImage, c.chestImage, c.detailImage, c.image4, c.image5]).filter(Boolean));
    const removedImages = oldImages.filter((img) => !newImages.has(img));
    if (removedImages.length > 0) {
      await deleteS3Objects(removedImages);
    }
  }

  return productId;
}

class ProductsController {
  list = async (
    req: FastifyRequest<{ Querystring: { collection?: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const collection = req.query.collection;
      const cacheKey = `products:${collection ?? "all"}`;
      const cached = await cacheGet<ProductDTO[]>(cacheKey);
      if (cached) return reply.status(200).send(fmt.formatResponse(cached));
      const products = await listProducts({ collection });
      await cacheSet(cacheKey, products);
      reply.status(200).send(fmt.formatResponse(products));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  getBySlug = async (req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const cacheKey = `product:${req.params.slug}`;
      const cached = await cacheGet<ProductDTO>(cacheKey);
      if (cached) return reply.status(200).send(fmt.formatResponse(cached));
      const product = await getProductBySlug(req.params.slug);
      if (!product) {
        throw new NotFoundException({
          message: "Product not found",
          description: `No product with slug "${req.params.slug}".`,
        });
      }
      await cacheSet(cacheKey, product);
      reply.status(200).send(fmt.formatResponse(product));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminList = async (
    req: FastifyRequest<{ Querystring: { includeInactive?: boolean } }>,
    reply: FastifyReply,
  ) => {
    try {
      const products = await listProducts({ includeInactive: req.query.includeInactive !== false });
      const raw = await client.product.findMany({
        where: { deletedAt: null },
        select: { id: true, isActive: true, sortOrder: true },
      });
      const extraById = new Map(raw.map((r) => [r.id, r]));
      const data = products.map((p) => ({
        ...p,
        isActive: extraById.get(p.id)?.isActive ?? true,
        sortOrder: extraById.get(p.id)?.sortOrder ?? 0,
      }));
      reply.status(200).send(fmt.formatResponse(data));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminGet = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const [product, raw] = await Promise.all([
        getProductById(req.params.id),
        client.product.findFirst({
          where: { id: req.params.id, deletedAt: null },
          select: { isActive: true, sortOrder: true },
        }),
      ]);
      if (!product || !raw) {
        throw new NotFoundException({
          message: "Product not found",
          description: `No product with id "${req.params.id}".`,
        });
      }
      reply
        .status(200)
        .send(fmt.formatResponse({ ...product, isActive: raw.isActive, sortOrder: raw.sortOrder }));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  create = async (req: FastifyRequest<{ Body: UpsertBody }>, reply: FastifyReply) => {
    try {
      const existing = await client.product.findUnique({ where: { slug: req.body.slug } });
      if (existing) {
        throw new BadRequestException({
          message: `A product with slug "${req.body.slug}" already exists.`,
          description: "Slugs must be unique — use PUT to update it.",
        });
      }
      const id = await writeProduct(req.body);
      await cacheInvalidate();
      const product = await getProductBySlug(req.body.slug);
      reply.status(201).send(fmt.formatResponse(product, `Product ${id} created`));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  update = async (
    req: FastifyRequest<{ Params: { id: string }; Body: UpsertBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const existing = await client.product.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Product not found",
          description: `No product with id "${req.params.id}".`,
        });
      }
      await writeProduct(req.body, existing.id);
      await cacheInvalidate();
      const product = await getProductBySlug(req.body.slug);
      reply.status(200).send(fmt.formatResponse(product, "Product updated"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  remove = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const existing = await client.product.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Product not found",
          description: `No product with id "${req.params.id}".`,
        });
      }

      const colors = await client.productColor.findMany({
        where: { productId: existing.id },
        select: { image: true, backImage: true, chestImage: true, detailImage: true, image4: true, image5: true },
      });

      await client.product.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });

      const imagesToDelete = colors
        .flatMap((c) => [c.image, c.backImage, c.chestImage, c.detailImage, c.image4, c.image5])
        .filter((img): img is string => Boolean(img));
      if (imagesToDelete.length > 0) {
        await deleteS3Objects(imagesToDelete);
      }

      await cacheInvalidate();
      reply.status(200).send(fmt.formatResponse({ deleted: true }, "Product deleted"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new ProductsController();
