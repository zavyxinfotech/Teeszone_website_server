import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

class NewsletterController {
  subscribe = async (req: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      await client.newsletterSubscriber.upsert({
        where: { email },
        update: { deletedAt: null },
        create: { email },
      });
      reply.status(200).send(fmt.formatResponse({ subscribed: true }, "Subscribed"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  list = async (
    req: FastifyRequest<{ Querystring: { page: number; limit: number } }>,
    reply: FastifyReply,
  ) => {
    try {
      const { page, limit } = req.query;
      const where = { deletedAt: null };
      const [rows, total] = await Promise.all([
        client.newsletterSubscriber.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        client.newsletterSubscriber.count({ where }),
      ]);
      reply.status(200).send(
        fmt.formatResponse({
          items: rows.map((r) => ({
            id: r.id,
            email: r.email,
            createdAt: r.createdAt.toISOString(),
          })),
          total,
        }),
      );
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new NewsletterController();
