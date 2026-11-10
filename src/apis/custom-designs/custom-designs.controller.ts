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

class CustomDesignsController {
  getMyDesigns = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const designs = await (client as any).userCustomDesign.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      reply.status(200).send(fmt.formatResponse({ designs }, "User custom designs retrieved"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  getDesignBySlug = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      const { productSlug } = (req.params || {}) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const design = await (client as any).userCustomDesign.findFirst({
        where: { userId, productSlug },
        orderBy: { updatedAt: "desc" },
      });
      reply.status(200).send(fmt.formatResponse({ design: design || null }, "Design retrieved"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  saveDesign = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      const b = (req.body || {}) as any;

      // Upsert user design by slug
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (client as any).userCustomDesign.findFirst({
        where: { userId, productSlug: b.productSlug },
      });

      let saved;
      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saved = await (client as any).userCustomDesign.update({
          where: { id: existing.id },
          data: {
            productName: b.productName,
            colorName: b.colorName,
            colorHex: b.colorHex || null,
            companyName: b.companyName || null,
            logoUrl: b.logoUrl || null,
            logoName: b.logoName || null,
            frontPreviewUrl: b.frontPreviewUrl || null,
            backPreviewUrl: b.backPreviewUrl || null,
            printLocation: b.printLocation || null,
            embroideryNotes: b.embroideryNotes || null,
          },
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        saved = await (client as any).userCustomDesign.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            productSlug: b.productSlug,
            productName: b.productName,
            colorName: b.colorName,
            colorHex: b.colorHex || null,
            companyName: b.companyName || null,
            logoUrl: b.logoUrl || null,
            logoName: b.logoName || null,
            frontPreviewUrl: b.frontPreviewUrl || null,
            backPreviewUrl: b.backPreviewUrl || null,
            printLocation: b.printLocation || null,
            embroideryNotes: b.embroideryNotes || null,
          },
        });
      }

      reply.status(200).send(fmt.formatResponse({ design: saved }, "Custom design saved privately"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  deleteDesign = async (req: FastifyRequest<any>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      const { productSlug } = (req.params || {}) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any).userCustomDesign.deleteMany({
        where: { userId, productSlug },
      });
      reply.status(200).send(fmt.formatResponse({ deleted: true }, "Custom design deleted"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new CustomDesignsController();
