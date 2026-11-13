import { FastifyReply, FastifyRequest } from "fastify";
import crypto from "crypto";
import { fmt } from "../../config";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";
import { sendOrderPlacedNotification } from "../../services/email.service";
import { sendOrderWhatsAppAlert } from "../../services/whatsapp.service";

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

      // Prevent duplicate order creation if paymentId is already recorded
      if (b.razorpayPaymentId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await (client as any).userOrder.findFirst({
          where: { razorpayPaymentId: b.razorpayPaymentId },
        });
        if (existing) {
          return reply.status(200).send(fmt.formatResponse({ order: existing }, "Order already recorded"));
        }
      }

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
      const now = new Date();

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
          status: "Order Placed", // Initial lifecycle status per specification
          paymentStatus: "PAID",
          items: b.items || [],
          shippingAddress: b.shippingAddress || null,
          statusUpdatedAt: now,
          reviewStatus: "Review Pending",
          socialDismissed: false,
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
          status: "Order Placed",
          details: {
            amount: b.amount,
            itemCount: Array.isArray(b.items) ? b.items.length : 1,
            razorpayPaymentId: b.razorpayPaymentId || null,
          },
        },
      });

      // Fire-and-forget real-time Email Notification to info@teeszone.in & customer
      void sendOrderPlacedNotification({
        orderNumber,
        userName,
        userEmail,
        userPhone,
        amount: b.amount,
        items: b.items || [],
        shippingAddress: b.shippingAddress,
      });

      // Fire-and-forget real-time WhatsApp alert to Admin
      void sendOrderWhatsAppAlert({
        orderNumber,
        userName,
        userPhone,
        amount: b.amount,
        itemsCount: Array.isArray(b.items)
          ? b.items.reduce((acc: number, it: any) => acc + (it.qty || 1), 0)
          : 1,
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

      if (status && status !== "ALL") {
        where.status = status;
      }

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

  adminUpdateStatus = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: {
        status: "Order Placed" | "Processing" | "Dispatched";
        trackingId?: string;
        courierName?: string;
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const orderId = req.params.id;
      const { status, trackingId, courierName } = req.body || {};

      const validStatuses = ["Order Placed", "Processing", "Dispatched"];
      if (!validStatuses.includes(status)) {
        return reply.status(400).send({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentOrder = await (client as any).userOrder.findUnique({
        where: { id: orderId },
      });

      if (!currentOrder) {
        return reply.status(404).send({
          success: false,
          error: "Order not found",
        });
      }

      const now = new Date();
      const updateData: any = {
        status,
        statusUpdatedAt: now,
      };

      if (trackingId !== undefined) {
        updateData.trackingId = trackingId.trim() || null;
      }
      if (courierName !== undefined) {
        updateData.courierName = courierName.trim() || null;
      }

      // When marked as Dispatched, trigger the Google Review workflow
      if (status === "Dispatched" && currentOrder.reviewStatus !== "Review Acknowledged") {
        updateData.reviewStatus = "Review Requested";
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedOrder = await (client as any).userOrder.update({
        where: { id: orderId },
        data: updateData,
      });

      // Log activity for audit and dashboard monitoring
      const activityType =
        status === "Processing"
          ? "ORDER_PROCESSING"
          : status === "Dispatched"
          ? "ORDER_DISPATCHED"
          : "ORDER_STATUS_UPDATED";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).customerActivity.create({
        data: {
          id: crypto.randomUUID(),
          userId: currentOrder.userId,
          userName: currentOrder.userName,
          userEmail: currentOrder.userEmail,
          activityType,
          orderId: currentOrder.orderNumber,
          status,
          details: {
            previousStatus: currentOrder.status,
            newStatus: status,
            trackingId: updateData.trackingId || currentOrder.trackingId,
            courierName: updateData.courierName || currentOrder.courierName,
          },
        },
      });

      reply.status(200).send(fmt.formatResponse({ order: updatedOrder }, `Order status updated to ${status}`));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  updateCustomerReview = async (
    req: FastifyRequest<{
      Params: { id: string };
      Body: {
        action: "submit_rating" | "acknowledge" | "review_later" | "open_google" | "close";
        rating?: number;
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const orderId = req.params.id;
      const userId = req.authUser!.userId;
      const { action, rating } = req.body || {};

      // Security: ensure the customer only updates their own order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order = await (client as any).userOrder.findFirst({
        where: { id: orderId, userId },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: "Order not found or permission denied",
        });
      }

      const updateData: any = {};

      if (action === "submit_rating") {
        if (typeof rating === "number" && rating >= 1 && rating <= 5) {
          updateData.internalRating = rating;
          updateData.reviewStatus = "Review Acknowledged";
        }
      } else if (action === "acknowledge") {
        updateData.reviewStatus = "Review Acknowledged";
        if (typeof rating === "number" && rating >= 1 && rating <= 5) {
          updateData.internalRating = rating;
        }
      } else if (action === "review_later") {
        updateData.reviewDismissedAt = new Date();
        // Do NOT mark as completed
      } else if (action === "open_google") {
        // Redirect click alone does not verify Google review submission
        // Keep status as Review Requested or current state
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedOrder = Object.keys(updateData).length > 0
        ? await (client as any).userOrder.update({
            where: { id: orderId },
            data: updateData,
          })
        : order;

      // Log review interaction activity
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).customerActivity.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          userName: order.userName,
          userEmail: order.userEmail,
          activityType: "REVIEW_INTERACTION",
          orderId: order.orderNumber,
          status: updatedOrder.reviewStatus,
          details: {
            action,
            rating: updateData.internalRating || null,
          },
        },
      });

      reply.status(200).send(fmt.formatResponse({ order: updatedOrder }, "Review interaction recorded"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  dismissSocialNotification = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const orderId = req.params.id;
      const userId = req.authUser!.userId;

      // Security: ensure user owns order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order = await (client as any).userOrder.findFirst({
        where: { id: orderId, userId },
      });

      if (!order) {
        return reply.status(404).send({
          success: false,
          error: "Order not found or permission denied",
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (client as any).userOrder.update({
        where: { id: orderId },
        data: { socialDismissed: true },
      });

      reply.status(200).send(fmt.formatResponse({ order: updated }, "Social notification dismissed"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new OrdersController();
