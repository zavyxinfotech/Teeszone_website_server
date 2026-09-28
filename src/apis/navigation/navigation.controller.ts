import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../../config";
import { cacheGet, cacheSet } from "../../services/cache.service";
import {
  CollectionDTO,
  listCollections,
  listNavSegments,
  SegmentDTO,
} from "../../services/catalog.service";
import { captureRequestError } from "../../utils/error-tracking";

type NavigationPayload = { segments: SegmentDTO[]; collections: CollectionDTO[] };

class NavigationController {
  get = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const cached = await cacheGet<NavigationPayload>("navigation");
      if (cached) return reply.status(200).send(fmt.formatResponse(cached));
      const [segments, collections] = await Promise.all([listNavSegments(), listCollections()]);
      const payload: NavigationPayload = { segments, collections };
      await cacheSet("navigation", payload);
      reply.status(200).send(fmt.formatResponse(payload));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      captureRequestError(error, req);
      const formatted = fmt.formatError(error);
      const { status, ...body } = formatted;
      reply.status(status).send(body);
    }
  };
}

export default new NavigationController();
