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

// Strip sensitive fields
const sanitizeDetails = (details: any) => {
  if (!details || typeof details !== "object") return details;
  const clean = { ...details };
  delete clean.password;
  delete clean.passwordHash;
  delete clean.token;
  delete clean.cvv;
  delete clean.cardNumber;
  delete clean.card;
  delete clean.secret;
  return clean;
};

class ActivityController {
  logActivity = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const b = (req.body || {}) as any;
      const authUser = req.authUser;

      let userId = authUser?.userId || null;
      let userName = b.userName || null;
      let userEmail = b.userEmail || null;

      // If user is authenticated, retrieve verified user profile info
      if (userId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = await (client as any).user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        if (u) {
          userName = u.name || userName;
          userEmail = u.email || userEmail;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = await (client as any).customerActivity.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          userName,
          userEmail,
          activityType: b.activityType,
          productId: b.productId || null,
          productName: b.productName || null,
          orderId: b.orderId || null,
          status: b.status || "COMPLETED",
          details: sanitizeDetails(b.details),
          ipAddress: req.ip || null,
        },
      });

      reply.status(201).send(fmt.formatResponse({ id: entry.id }, "Activity recorded"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminList = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const {
        search,
        activityType,
        productId,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
      } = (req.query || {}) as any;

      const where: any = {};

      if (activityType) {
        where.activityType = activityType;
      }

      if (productId) {
        where.productId = productId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (search) {
        where.OR = [
          { userName: { contains: search } },
          { userEmail: { contains: search } },
          { userId: { contains: search } },
          { productName: { contains: search } },
          { orderId: { contains: search } },
          { activityType: { contains: search } },
        ];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [items, total, countsByType] = await Promise.all([
        (client as any).customerActivity.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: Number(limit),
          skip: Number(offset),
        }),
        (client as any).customerActivity.count({ where }),
        (client as any).customerActivity.groupBy({
          by: ["activityType"],
          _count: { _all: true },
        }),
      ]);

      const typeSummary: Record<string, number> = {};
      countsByType.forEach((c: any) => {
        typeSummary[c.activityType] = c._count._all;
      });

      reply.status(200).send(
        fmt.formatResponse(
          {
            items,
            total,
            limit: Number(limit),
            offset: Number(offset),
            typeSummary,
          },
          "Customer activities retrieved"
        )
      );
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new ActivityController();
