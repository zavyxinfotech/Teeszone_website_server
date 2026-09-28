import type { Prisma, Role } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { NotFoundException } from "../../exception/notfound.exception";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

const toDTO = (row: {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: Role;
  passwordHash: string | null;
  googleId: string | null;
  createdAt: Date;
  _count: { addresses: number };
}) => ({
  id: row.id,
  email: row.email ?? "",
  name: row.name ?? "",
  phone: row.phone ?? "",
  role: row.role,
  hasPassword: !!row.passwordHash,
  googleLinked: !!row.googleId,
  addressCount: row._count.addresses,
  createdAt: row.createdAt.toISOString(),
});

class CustomersController {
  list = async (
    req: FastifyRequest<{ Querystring: { q?: string; role?: Role; page: number; limit: number } }>,
    reply: FastifyReply,
  ) => {
    try {
      const { q, role, page, limit } = req.query;
      const where: Prisma.UserWhereInput = {
        deletedAt: null,
        ...(role ? { role } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      };
      const [rows, total] = await Promise.all([
        client.user.findMany({
          where,
          include: { _count: { select: { addresses: { where: { deletedAt: null } } } } },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        client.user.count({ where }),
      ]);
      reply.status(200).send(fmt.formatResponse({ items: rows.map(toDTO), total }));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  get = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const row = await client.user.findFirst({
        where: { id: req.params.id, deletedAt: null },
        include: {
          _count: { select: { addresses: { where: { deletedAt: null } } } },
          addresses: {
            where: { deletedAt: null },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          },
        },
      });
      if (!row) {
        throw new NotFoundException({
          message: "Customer not found",
          description: `No customer with id "${req.params.id}".`,
        });
      }
      reply.status(200).send(
        fmt.formatResponse({
          ...toDTO(row),
          addresses: row.addresses.map((a) => ({
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
          })),
        }),
      );
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new CustomersController();
