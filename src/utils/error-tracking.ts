import { FastifyRequest } from "fastify";
import logger from "./logger";

export const captureError = (error: unknown, context?: Record<string, unknown>) => {
  logger.error({ err: error, ...context }, "captured error");
};

export const captureRequestError = (error: unknown, request?: FastifyRequest) => {
  logger.error({ err: error, url: request?.url, method: request?.method }, "request error");
};
