import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { optionalAuthMiddleware } from "../../middleware/optional-auth.middleware";
import ordersController from "./orders.controller";
import { createOrderSchema } from "./orders.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  {
    url: "/",
    method: API_METHODS.GET,
    preHandler: [authMiddleware],
    handler: ordersController.getMyOrders,
  },
  {
    url: "/",
    method: API_METHODS.POST,
    schema: createOrderSchema,
    preHandler: [optionalAuthMiddleware],
    handler: ordersController.createOrder,
  },
  {
    url: "/admin",
    method: API_METHODS.GET,
    preHandler: [authMiddleware, adminMiddleware],
    handler: ordersController.adminList,
  },
];

export default routes;
