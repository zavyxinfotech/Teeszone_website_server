import { FastifyInstance } from "fastify";
import routes from "./orders.route";

export default async function (fastify: FastifyInstance) {
  for (const r of routes) {
    fastify.route({
      url: r.url,
      method: r.method,
      schema: r.schema,
      preHandler: r.preHandler,
      handler: r.handler,
    });
  }
}
