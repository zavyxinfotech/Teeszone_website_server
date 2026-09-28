import { FastifyInstance } from "fastify";
import { RouteOptions } from "fastify/types/route";
import routes from "./customers.route";

export default async (fastify: FastifyInstance) => {
  for (const route of routes) {
    fastify.route(route as unknown as RouteOptions);
  }
};
