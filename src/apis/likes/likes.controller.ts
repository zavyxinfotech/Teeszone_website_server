import { FastifyReply, FastifyRequest } from "fastify";
import crypto from "crypto";
import { fmt } from "../../config";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

interface ToggleBody {
  productSlug: string;
  productName?: string;
}

class LikesController {
  getMyLikes = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const likes = await (client as any).productLike.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      const slugs = likes.map((l: any) => l.productSlug);
      reply.status(200).send(fmt.formatResponse({ slugs, items: likes }, "User liked products"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  toggleLike = async (req: FastifyRequest<{ Body: ToggleBody }>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      const { productSlug, productName } = req.body;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (client as any).productLike.findUnique({
        where: {
          userId_productSlug: {
            userId,
            productSlug,
          },
        },
      });

      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any).productLike.delete({
          where: { id: existing.id },
        });
        return reply.status(200).send(
          fmt.formatResponse(
            { liked: false, productSlug },
            "Product removed from liked items",
          ),
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await (client as any).productLike.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          productSlug,
          productName: productName || productSlug,
        },
      });

      reply.status(200).send(
        fmt.formatResponse(
          { liked: true, productSlug, item: created },
          "Product added to liked items",
        ),
      );
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminList = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const likes = await (client as any).productLike.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const items = likes.map((l: any) => ({
        id: l.id,
        userId: l.userId,
        userName: l.user?.name || "Customer",
        userEmail: l.user?.email || "—",
        userPhone: l.user?.phone || "—",
        userCompany: l.user?.company || "—",
        productSlug: l.productSlug,
        productName: l.productName,
        createdAt: l.createdAt,
      }));

      reply.status(200).send(fmt.formatResponse(items, "All user product likes"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new LikesController();
