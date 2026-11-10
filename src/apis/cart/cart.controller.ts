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

class CartController {
  getMyCart = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = await (client as any).userCartItem.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });

      const formatted = items.map((i: any) => ({
        key: i.itemKey,
        slug: i.slug,
        name: i.name,
        image: i.image,
        colorName: i.colorName,
        colorHex: i.colorHex,
        size: i.size,
        qty: i.qty,
        customNote: i.customNote || "",
      }));

      reply.status(200).send(fmt.formatResponse({ items: formatted }, "User cart retrieved"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  syncCart = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      const { items } = (req.body || {}) as any;

      // Replace user's cart transactionally
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).$transaction([
        (client as any).userCartItem.deleteMany({ where: { userId } }),
        ...(items || []).map((i: any) =>
          (client as any).userCartItem.create({
            data: {
              id: crypto.randomUUID(),
              userId,
              itemKey: i.key,
              slug: i.slug,
              name: i.name,
              image: i.image,
              colorName: i.colorName,
              colorHex: i.colorHex,
              size: i.size,
              qty: i.qty,
              customNote: i.customNote || null,
            },
          })
        ),
      ]);

      reply.status(200).send(fmt.formatResponse({ success: true, count: (items || []).length }, "Cart synced"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  updateQty = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      const { key, qty } = (req.body || {}) as any;

      if (qty <= 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any).userCartItem.deleteMany({
          where: { userId, itemKey: key },
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client as any).userCartItem.updateMany({
          where: { userId, itemKey: key },
          data: { qty },
        });
      }

      reply.status(200).send(fmt.formatResponse({ key, qty }, "Cart quantity updated"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  removeItem = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      const { key } = (req.body || {}) as any;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).userCartItem.deleteMany({
        where: { userId, itemKey: key },
      });

      reply.status(200).send(fmt.formatResponse({ key, removed: true }, "Item removed from cart"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  clearCart = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).userCartItem.deleteMany({ where: { userId } });
      reply.status(200).send(fmt.formatResponse({ cleared: true }, "Cart cleared"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new CartController();
