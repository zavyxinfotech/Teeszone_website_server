import { FastifyReply, FastifyRequest } from "fastify";
import type { Address } from "@prisma/client";
import { fmt } from "../../config";
import { BadRequestException } from "../../exception/badrequest.exception";
import { NotFoundException } from "../../exception/notfound.exception";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

const MAX_ADDRESSES = 10;

interface AddressBody {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  type: "HOME" | "WORK" | "OTHER";
  isDefault: boolean;
}

const serialize = (a: Address) => ({
  id: a.id,
  fullName: a.fullName,
  phone: a.phone,
  line1: a.line1,
  line2: a.line2,
  city: a.city,
  state: a.state,
  pincode: a.pincode,
  type: a.type,
  isDefault: a.isDefault,
});

class AddressesController {
  list = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const addresses = await client.address.findMany({
        where: { userId: req.authUser!.userId, deletedAt: null },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });
      reply.status(200).send(fmt.formatResponse(addresses.map(serialize), "Addresses"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  create = async (req: FastifyRequest<{ Body: AddressBody }>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      const count = await client.address.count({ where: { userId, deletedAt: null } });
      if (count >= MAX_ADDRESSES) {
        throw new BadRequestException({
          message: `You can save up to ${MAX_ADDRESSES} addresses.`,
          description: "Delete one you no longer use, then add the new address.",
        });
      }

      const makeDefault = req.body.isDefault || count === 0;
      const address = await client.$transaction(async (tx) => {
        if (makeDefault) {
          await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
        }
        return tx.address.create({
          data: { ...req.body, line2: req.body.line2 || null, isDefault: makeDefault, userId },
        });
      });
      reply.status(201).send(fmt.formatResponse(serialize(address), "Address added"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  update = async (
    req: FastifyRequest<{ Params: { id: string }; Body: AddressBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const userId = req.authUser!.userId;
      const existing = await client.address.findFirst({
        where: { id: req.params.id, userId, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Address not found",
          description: "It may have been removed already.",
        });
      }

      const makeDefault = req.body.isDefault || existing.isDefault;
      const address = await client.$transaction(async (tx) => {
        if (makeDefault) {
          await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
        }
        return tx.address.update({
          where: { id: existing.id },
          data: { ...req.body, line2: req.body.line2 || null, isDefault: makeDefault },
        });
      });
      reply.status(200).send(fmt.formatResponse(serialize(address), "Address updated"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  remove = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const userId = req.authUser!.userId;
      const existing = await client.address.findFirst({
        where: { id: req.params.id, userId, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Address not found",
          description: "It may have been removed already.",
        });
      }

      await client.$transaction(async (tx) => {
        await tx.address.update({
          where: { id: existing.id },
          data: { deletedAt: new Date(), isDefault: false },
        });
        if (existing.isDefault) {
          const next = await tx.address.findFirst({
            where: { userId, deletedAt: null },
            orderBy: { createdAt: "desc" },
          });
          if (next) {
            await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
          }
        }
      });
      reply.status(200).send(fmt.formatResponse({ deleted: true }, "Address removed"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new AddressesController();
