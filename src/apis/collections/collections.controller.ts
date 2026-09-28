import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { BadRequestException } from "../../exception/badrequest.exception";
import { NotFoundException } from "../../exception/notfound.exception";
import { cacheGet, cacheInvalidate, cacheSet } from "../../services/cache.service";
import {
  CollectionDTO,
  getCollectionBySlug,
  listCollections,
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
  slug: string;
  name: string;
  description: string;
  segment: string;
  group: string;
  sortOrder: number;
};

async function resolveSegmentAndGroup(body: UpsertBody) {
  const segment = await client.segment.findFirst({
    where: { slug: body.segment, deletedAt: null },
  });
  if (!segment) {
    throw new BadRequestException({
      message: `Unknown segment "${body.segment}"`,
      description: "Segments: unisex, men, women, kids, shop-more.",
    });
  }
  const group = await client.segmentGroup.upsert({
    where: { segmentId_title: { segmentId: segment.id, title: body.group } },
    update: { deletedAt: null },
    create: { segmentId: segment.id, title: body.group },
  });
  return { segmentId: segment.id, groupId: group.id };
}

class CollectionsController {
  list = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const cached = await cacheGet<CollectionDTO[]>("collections");
      if (cached) return reply.status(200).send(fmt.formatResponse(cached));
      const collections = await listCollections();
      await cacheSet("collections", collections);
      reply.status(200).send(fmt.formatResponse(collections));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminList = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const rows = await client.collection.findMany({
        where: { deletedAt: null },
        include: {
          segment: { select: { slug: true, sortOrder: true } },
          group: { select: { title: true, sortOrder: true } },
          _count: { select: { products: { where: { product: { deletedAt: null } } } } },
        },
      });
      const [newCount, bestCount, saleCount] = await Promise.all([
        client.product.count({ where: { deletedAt: null, isNew: true } }),
        client.product.count({ where: { deletedAt: null, bestSeller: true } }),
        client.product.count({ where: { deletedAt: null, megaSale: true } }),
      ]);
      const virtualCounts: Record<string, number> = {
        "new-arrival": newCount,
        "best-sellers": bestCount,
        "mega-sale": saleCount,
      };
      rows.sort(
        (a, b) =>
          a.segment.sortOrder - b.segment.sortOrder ||
          a.group.sortOrder - b.group.sortOrder ||
          a.sortOrder - b.sortOrder,
      );
      const data = rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        segment: r.segment.slug,
        group: r.group.title,
        description: r.description,
        isVirtual: r.isVirtual,
        sortOrder: r.sortOrder,
        productCount: r.isVirtual ? (virtualCounts[r.slug] ?? 0) : r._count.products,
      }));
      reply.status(200).send(fmt.formatResponse(data));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  getBySlug = async (req: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const cacheKey = `collection:${req.params.slug}`;
      const cached = await cacheGet<CollectionDTO>(cacheKey);
      if (cached) return reply.status(200).send(fmt.formatResponse(cached));
      const collection = await getCollectionBySlug(req.params.slug);
      if (!collection) {
        throw new NotFoundException({
          message: "Collection not found",
          description: `No collection with slug "${req.params.slug}".`,
        });
      }
      await cacheSet(cacheKey, collection);
      reply.status(200).send(fmt.formatResponse(collection));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  create = async (req: FastifyRequest<{ Body: UpsertBody }>, reply: FastifyReply) => {
    try {
      const existing = await client.collection.findUnique({ where: { slug: req.body.slug } });
      if (existing) {
        throw new BadRequestException({
          message: `A collection with slug "${req.body.slug}" already exists.`,
          description: "Slugs must be unique — use PUT to update it.",
        });
      }
      const { segmentId, groupId } = await resolveSegmentAndGroup(req.body);
      await client.collection.create({
        data: {
          slug: req.body.slug,
          name: req.body.name,
          description: req.body.description,
          segmentId,
          groupId,
          sortOrder: req.body.sortOrder,
        },
      });
      await cacheInvalidate();
      const collection = await getCollectionBySlug(req.body.slug);
      reply.status(201).send(fmt.formatResponse(collection, "Collection created"));
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
      const existing = await client.collection.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Collection not found",
          description: `No collection with id "${req.params.id}".`,
        });
      }
      if (existing.isVirtual) {
        throw new BadRequestException({
          message: "Virtual collections cannot be edited",
          description: "new-arrival / best-sellers / mega-sale are flag-driven.",
        });
      }
      const { segmentId, groupId } = await resolveSegmentAndGroup(req.body);
      await client.collection.update({
        where: { id: existing.id },
        data: {
          slug: req.body.slug,
          name: req.body.name,
          description: req.body.description,
          segmentId,
          groupId,
          sortOrder: req.body.sortOrder,
        },
      });
      await cacheInvalidate();
      const collection = await getCollectionBySlug(req.body.slug);
      reply.status(200).send(fmt.formatResponse(collection, "Collection updated"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  remove = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const existing = await client.collection.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Collection not found",
          description: `No collection with id "${req.params.id}".`,
        });
      }
      if (existing.isVirtual) {
        throw new BadRequestException({
          message: "Virtual collections cannot be deleted",
          description: "new-arrival / best-sellers / mega-sale are flag-driven.",
        });
      }
      await client.collection.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });
      await cacheInvalidate();
      reply.status(200).send(fmt.formatResponse({ deleted: true }, "Collection deleted"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new CollectionsController();
