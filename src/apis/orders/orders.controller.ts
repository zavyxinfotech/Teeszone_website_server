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

class OrdersController {
  getMyOrders = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orders = await (client as any).userOrder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      reply.status(200).send(fmt.formatResponse({ orders }, "User orders retrieved"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  createOrder = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser?.userId || null;
      const b = (req.body || {}) as any;

      let userName = null;
      let userEmail = null;
      let userPhone = b.userPhone || null;

      if (userId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = await (client as any).user.findUnique({
          where: { id: userId },
          select: { name: true, email: true, phone: true },
        });
        if (u) {
          userName = u.name;
          userEmail = u.email;
          userPhone = u.phone || userPhone;
        }
      }

      const orderNumber = `TZ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order = await (client as any).userOrder.create({
        data: {
          id: crypto.randomUUID(),
          orderNumber,
          userId,
          userName,
          userEmail,
          userPhone,
          razorpayOrderId: b.razorpayOrderId || null,
          razorpayPaymentId: b.razorpayPaymentId || null,
          amount: b.amount,
          currency: "INR",
          status: "PAID",
          items: b.items || [],
          shippingAddress: b.shippingAddress || null,
        },
      });

      // Automatically log the order activity for admin real-time monitoring
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).customerActivity.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          userName,
          userEmail,
          activityType: "ORDER_PLACED",
          orderId: orderNumber,
          status: "PAID",
          details: {
            amount: b.amount,
            itemCount: Array.isArray(b.items) ? b.items.length : 1,
            razorpayPaymentId: b.razorpayPaymentId || null,
          },
        },
      });

      reply.status(201).send(fmt.formatResponse({ order }, "Order placed successfully"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminList = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const { search, status, limit = 50, offset = 0 } = req.query as any;
      const where: any = {};

      if (status) where.status = status;
      if (search) {
        where.OR = [
          { orderNumber: { contains: search } },
          { userName: { contains: search } },
          { userEmail: { contains: search } },
          { userId: { contains: search } },
        ];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [orders, total] = await Promise.all([
        (client as any).userOrder.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: Number(limit),
          skip: Number(offset),
        }),
        (client as any).userOrder.count({ where }),
      ]);

      reply.status(200).send(fmt.formatResponse({ orders, total }, "Admin orders retrieved"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new OrdersController();
