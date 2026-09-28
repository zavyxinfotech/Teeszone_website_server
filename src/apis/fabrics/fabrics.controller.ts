import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { BadRequestException } from "../../exception/badrequest.exception";
import { NotFoundException } from "../../exception/notfound.exception";
import { cacheGet, cacheInvalidate, cacheSet } from "../../services/cache.service";
import { FabricDTO, listFabrics } from "../../services/catalog.service";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

type UpsertBody = {
  key: string;
  name: string;
  description: string;
  fit: string;
  highlights: string[];
  image: string;
  sortOrder: number;
};

const toDTO = (row: {
  key: string;
  name: string;
  description: string;
  fit: string;
  highlights: unknown;
  image: string;
}): FabricDTO => ({
  key: row.key,
  name: row.name,
  description: row.description,
  fit: row.fit,
  highlights: (row.highlights as string[]) ?? [],
  image: row.image,
});

class FabricsController {
  list = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const cached = await cacheGet<FabricDTO[]>("fabrics");
      if (cached) return reply.status(200).send(fmt.formatResponse(cached));
      const fabrics = await listFabrics();
      await cacheSet("fabrics", fabrics);
      reply.status(200).send(fmt.formatResponse(fabrics));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  adminList = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const rows = await client.fabric.findMany({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      });
      reply
        .status(200)
        .send(fmt.formatResponse(rows.map((r) => ({ ...toDTO(r), id: r.id, sortOrder: r.sortOrder }))));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  create = async (req: FastifyRequest<{ Body: UpsertBody }>, reply: FastifyReply) => {
    try {
      const existing = await client.fabric.findUnique({ where: { key: req.body.key } });
      if (existing) {
        throw new BadRequestException({
          message: `A fabric with key "${req.body.key}" already exists.`,
          description: "Keys must be unique — use PUT to update it.",
        });
      }
      const row = await client.fabric.create({ data: req.body });
      await cacheInvalidate();
      reply.status(201).send(fmt.formatResponse(toDTO(row), "Fabric created"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  update = async (
    req: FastifyRequest<{ Params: { id: string }; Body: UpsertBody }>,
    reply: FastifyReply,
  ) => {
    try {
      const existing = await client.fabric.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Fabric not found",
          description: `No fabric with id "${req.params.id}".`,
        });
      }
      const row = await client.fabric.update({ where: { id: existing.id }, data: req.body });
      await cacheInvalidate();
      reply.status(200).send(fmt.formatResponse(toDTO(row), "Fabric updated"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  remove = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const existing = await client.fabric.findFirst({
        where: { id: req.params.id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException({
          message: "Fabric not found",
          description: `No fabric with id "${req.params.id}".`,
        });
      }
      await client.fabric.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
      await cacheInvalidate();
      reply.status(200).send(fmt.formatResponse({ deleted: true }, "Fabric deleted"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new FabricsController();
