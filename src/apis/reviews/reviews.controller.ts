import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { NotFoundException } from "../../exception/notfound.exception";
import { cacheGet, cacheInvalidate, cacheSet } from "../../services/cache.service";
import { listReviews, ReviewDTO } from "../../services/catalog.service";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

type UpsertBody = {
  stars: number;
  quote: string;
  author: string;
  product: string;
  isPublished: boolean;
  sortOrder: number;
};

const toAdminDTO = (row: {
  id: string;
  stars: number;
  quote: string;
  author: string;
  productName: string;
  isPublished: boolean;
  sortOrder: number;
}) => ({
  id: row.id,
  stars: row.stars,
  quote: row.quote,
  author: row.author,
  product: row.productName,
  isPublished: row.isPublished,
  sortOrder: row.sortOrder,
});

class ReviewsController {
  list = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const cached = await cacheGet<ReviewDTO[]>("reviews");
      if (cached) return reply.status(200).send(fmt.formatResponse(cached));
      const reviews = await listReviews();
      await cacheSet("reviews", reviews);
      reply.status(200).send(fmt.formatResponse(reviews));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminList = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const rows = await client.review.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      });
      reply.status(200).send(fmt.formatResponse(rows.map(toAdminDTO)));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  create = async (req: FastifyRequest<{ Body: UpsertBody }>, reply: FastifyReply) => {
    try {
      const { product, ...rest } = req.body;
      const row = await client.review.create({ data: { ...rest, productName: product } });
      await cacheInvalidate();
      reply.status(201).send(fmt.formatResponse(toAdminDTO(row), "Review created"));
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
      const existing = await client.review.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Review not found",
          description: `No review with id "${req.params.id}".`,
        });
      }
      const { product, ...rest } = req.body;
      const row = await client.review.update({
        where: { id: existing.id },
        data: { ...rest, productName: product },
      });
      await cacheInvalidate();
      reply.status(200).send(fmt.formatResponse(toAdminDTO(row), "Review updated"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  remove = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const existing = await client.review.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Review not found",
          description: `No review with id "${req.params.id}".`,
        });
      }
      await client.review.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
      await cacheInvalidate();
      reply.status(200).send(fmt.formatResponse({ deleted: true }, "Review deleted"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new ReviewsController();
