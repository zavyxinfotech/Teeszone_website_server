import { FastifyReply, FastifyRequest } from "fastify";
import { captureRequestError } from "../../utils/error-tracking";

class HealthController {
  check = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      reply.status(200).send({
        success: true,
        message: "TeesZone API is healthy",
        uptime: process.uptime(),
      });
    } catch (error) {
      captureRequestError(error, req);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      reply.status(err.status || 500).send({
        success: false,
        message: err.message || "Internal Server Error",
        description: err.description || undefined,
      });
    }
  };
}

export default new HealthController();
