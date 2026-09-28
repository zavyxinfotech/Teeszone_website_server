import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { listAdminPromotions } from "../../services/promotion.service";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

class DashboardController {
  stats = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const live = { deletedAt: null } as const;
      const [
        productsActive,
        productsInactive,
        collections,
        promotions,
        enqNew,
        enqContacted,
        enqClosed,
        reviewsPublished,
        reviewsUnpublished,
        customers,
        subscribers,
        recentEnquiries,
        recentCustomers,
      ] = await Promise.all([
        client.product.count({ where: { ...live, isActive: true } }),
        client.product.count({ where: { ...live, isActive: false } }),
        client.collection.count({ where: { ...live, isVirtual: false } }),
        listAdminPromotions(),
        client.enquiry.count({ where: { ...live, status: "NEW" } }),
        client.enquiry.count({ where: { ...live, status: "CONTACTED" } }),
        client.enquiry.count({ where: { ...live, status: "CLOSED" } }),
        client.review.count({ where: { ...live, isPublished: true } }),
        client.review.count({ where: { ...live, isPublished: false } }),
        client.user.count({ where: { ...live, role: "CUSTOMER" } }),
        client.newsletterSubscriber.count({ where: live }),
        client.enquiry.findMany({ where: live, orderBy: { createdAt: "desc" }, take: 5 }),
        client.user.findMany({
          where: { ...live, role: "CUSTOMER" },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, email: true, createdAt: true },
        }),
      ]);

      reply.status(200).send(
        fmt.formatResponse({
          products: { active: productsActive, inactive: productsInactive },
          collections,
          promotions: {
            live: promotions.filter((p) => p.status === "live").length,
            total: promotions.length,
          },
          enquiries: { new: enqNew, contacted: enqContacted, closed: enqClosed },
          reviews: { published: reviewsPublished, unpublished: reviewsUnpublished },
          customers,
          subscribers,
          recentEnquiries: recentEnquiries.map((e) => ({
            id: e.id,
            name: e.name,
            company: e.company,
            phone: e.phone,
            productId: e.productId,
            productName: e.productName,
            quantity: e.quantity,
            message: e.message,
            status: e.status,
            createdAt: e.createdAt.toISOString(),
          })),
          recentCustomers: recentCustomers.map((u) => ({
            id: u.id,
            name: u.name ?? "",
            email: u.email ?? "",
            createdAt: u.createdAt.toISOString(),
          })),
        }),
      );
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new DashboardController();
