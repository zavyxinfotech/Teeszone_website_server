import rTracer from "cls-rtracer";
import { FastifyRequest } from "fastify";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require("pino")({
  level: "info",
  mixin() {
    return { reqId: rTracer.id() };
  },
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname,reqId",
      messageFormat: "[{reqId}]: {msg}",
    },
  },
  serializers: {
    req(request: FastifyRequest) {
      return {
        method: request.method,
        url: request.url,
        ip: request.ip,
      };
    },
  },
});

export default logger;
export const rTracerPlugin = rTracer.fastifyPlugin;
