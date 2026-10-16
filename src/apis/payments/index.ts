import { FastifyPluginAsync } from "fastify";
import routes from "./payments.route";

const paymentsPlugin: FastifyPluginAsync = async (fastify) => {
  routes.forEach((route) => {
    fastify.route(route);
  });
};

export default paymentsPlugin;
