import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { BadRequestException } from "../../exception/badrequest.exception";
import { NotFoundException } from "../../exception/notfound.exception";
import { cacheGet, cacheInvalidate, cacheSet } from "../../services/cache.service";
import {
  findLiveByCode,
  getAdminPromotion,
  listAdminPromotions,
  listPublicPromotions,
  PromotionDTO,
} from "../../services/promotion.service";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";
import type { PromotionUpsertBody } from "./promotions.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

async function writePromotion(body: PromotionUpsertBody, existingId?: string): Promise<string> {
  const productRows =
    body.scope === "PRODUCTS"
      ? await client.product.findMany({
          where: { slug: { in: body.productSlugs }, deletedAt: null },
          select: { id: true, slug: true },
        })
      : [];
  const collectionRows =
    body.scope === "COLLECTIONS"
      ? await client.collection.findMany({
          where: { slug: { in: body.collectionSlugs }, deletedAt: null },
          select: { id: true, slug: true },
        })
      : [];

  if (body.scope === "PRODUCTS") {
    const found = new Set(productRows.map((p) => p.slug));
    const missing = body.productSlugs.filter((s) => !found.has(s));
    if (missing.length) {
      throw new BadRequestException({
        message: `Unknown products: ${missing.join(", ")}`,
        description: "Every productSlug must match an existing product.",
      });
    }
  }
  if (body.scope === "COLLECTIONS") {
    const found = new Set(collectionRows.map((c) => c.slug));
    const missing = body.collectionSlugs.filter((s) => !found.has(s));
    if (missing.length) {
      throw new BadRequestException({
        message: `Unknown collections: ${missing.join(", ")}`,
        description: "Every collectionSlug must match an existing collection.",
      });
    }
  }

  if (body.code) {
    const clash = await client.promotion.findFirst({
      where: { code: body.code, deletedAt: null, ...(existingId ? { NOT: { id: existingId } } : {}) },
      select: { id: true },
    });
    if (clash) {
      throw new BadRequestException({
        message: `Coupon code "${body.code}" is already in use.`,
        description: "Codes must be unique across promotions.",
      });
    }
  }

  const base = {
    name: body.name,
    code: body.code,
    type: body.type,
    value: body.value,
    scope: body.scope,
    minQty: body.minQty,
    minOrderValue: body.minOrderValue,
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    endsAt: body.endsAt ? new Date(body.endsAt) : null,
    isActive: body.isActive,
    sortOrder: body.sortOrder,
  };

  return client.$transaction(async (tx) => {
    let promotionId = existingId;
    if (promotionId) {
      await tx.promotion.update({ where: { id: promotionId }, data: base });
    } else {
      const created = await tx.promotion.create({ data: base });
      promotionId = created.id;
    }
    await tx.promotionProduct.deleteMany({ where: { promotionId } });
    await tx.promotionCollection.deleteMany({ where: { promotionId } });
    if (productRows.length) {
      await tx.promotionProduct.createMany({
        data: productRows.map((p) => ({ promotionId: promotionId!, productId: p.id })),
      });
    }
    if (collectionRows.length) {
      await tx.promotionCollection.createMany({
        data: collectionRows.map((c) => ({ promotionId: promotionId!, collectionId: c.id })),
      });
    }
    return promotionId!;
  });
}

class PromotionsController {
  list = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const cached = await cacheGet<PromotionDTO[]>("promotions");
      if (cached) return reply.status(200).send(fmt.formatResponse(cached));
      const promotions = await listPublicPromotions();
      await cacheSet("promotions", promotions);
      reply.status(200).send(fmt.formatResponse(promotions));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  validate = async (req: FastifyRequest<{ Body: { code: string } }>, reply: FastifyReply) => {
    try {
      const promotion = await findLiveByCode(req.body.code);
      if (!promotion) {
        throw new NotFoundException({
          message: "This code isn't valid right now.",
          description: "Check the spelling or ask our team on WhatsApp.",
        });
      }
      reply.status(200).send(fmt.formatResponse(promotion, "Code applied"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminList = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.status(200).send(fmt.formatResponse(await listAdminPromotions()));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminGet = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const promotion = await getAdminPromotion(req.params.id);
      if (!promotion) {
        throw new NotFoundException({
          message: "Promotion not found",
          description: `No promotion with id "${req.params.id}".`,
        });
      }
      reply.status(200).send(fmt.formatResponse(promotion));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  create = async (req: FastifyRequest<{ Body: PromotionUpsertBody }>, reply: FastifyReply) => {
    try {
      const id = await writePromotion(req.body);
      await cacheInvalidate();
      reply.status(201).send(fmt.formatResponse(await getAdminPromotion(id), "Promotion created"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  update = async (
    req: FastifyRequest<{ Params: { id: string }; Body: PromotionUpsertBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const existing = await client.promotion.findFirst({
        where: { id: req.params.id, deletedAt: null },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Promotion not found",
          description: `No promotion with id "${req.params.id}".`,
        });
      }
      await writePromotion(req.body, existing.id);
      await cacheInvalidate();
      reply
        .status(200)
        .send(fmt.formatResponse(await getAdminPromotion(existing.id), "Promotion updated"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  remove = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const existing = await client.promotion.findFirst({
        where: { id: req.params.id, deletedAt: null },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Promotion not found",
          description: `No promotion with id "${req.params.id}".`,
        });
      }
      await client.promotion.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
      await cacheInvalidate();
      reply.status(200).send(fmt.formatResponse({ deleted: true }, "Promotion deleted"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new PromotionsController();
