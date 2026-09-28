import { EnquiryStatus } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { NotFoundException } from "../../exception/notfound.exception";
import { sendEnquiryNotification } from "../../services/email.service";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

type CreateBody = {
  name: string;
  company?: string;
  phone: string;
  product?: string;
  quantity?: string;
  message?: string;
};

const toDTO = (row: {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  productId: string | null;
  productName: string | null;
  quantity: string | null;
  message: string | null;
  status: EnquiryStatus;
  createdAt: Date;
}) => ({
  id: row.id,
  name: row.name,
  company: row.company,
  phone: row.phone,
  productId: row.productId,
  productName: row.productName,
  quantity: row.quantity,
  message: row.message,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
});

class EnquiriesController {
  create = async (req: FastifyRequest<{ Body: CreateBody }>, reply: FastifyReply) => {
    try {
      const body = req.body;
      let productId: string | null = null;
      let productName: string | null = null;
      if (body.product) {
        const product = await client.product.findFirst({
          where: { slug: body.product, deletedAt: null },
          select: { id: true, name: true },
        });
        productId = product?.id ?? null;
        productName = product?.name ?? body.product;
      }

      const enquiry = await client.enquiry.create({
        data: {
          name: body.name,
          company: body.company ?? null,
          phone: body.phone,
          productId,
          productName,
          quantity: body.quantity ?? null,
          message: body.message ?? null,
        },
      });

      // fire and forget
      void sendEnquiryNotification({
        name: enquiry.name,
        company: enquiry.company,
        phone: enquiry.phone,
        productName: enquiry.productName,
        quantity: enquiry.quantity,
        message: enquiry.message,
      });

      reply.status(201).send(fmt.formatResponse({ id: enquiry.id }, "Enquiry received"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  list = async (
    req: FastifyRequest<{ Querystring: { status?: EnquiryStatus; page: number; limit: number } }>,
    reply: FastifyReply,
  ) => {
    try {
      const { status, page, limit } = req.query;
      const where = { deletedAt: null, ...(status ? { status } : {}) };
      const [rows, total] = await Promise.all([
        client.enquiry.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        client.enquiry.count({ where }),
      ]);
      reply.status(200).send(fmt.formatResponse({ items: rows.map(toDTO), total }));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  updateStatus = async (
    req: FastifyRequest<{ Params: { id: string }; Body: { status: EnquiryStatus } }>,
    reply: FastifyReply,
  ) => {
    try {
      const existing = await client.enquiry.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Enquiry not found",
          description: `No enquiry with id "${req.params.id}".`,
        });
      }
      const row = await client.enquiry.update({
        where: { id: existing.id },
        data: { status: req.body.status },
      });
      reply.status(200).send(fmt.formatResponse(toDTO(row), "Enquiry updated"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new EnquiriesController();
