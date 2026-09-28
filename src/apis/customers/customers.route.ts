import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import customersController from "./customers.controller";
import { getCustomerSchema, listCustomersSchema } from "./customers.schema";

const admin = [authMiddleware, adminMiddleware];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/", method: API_METHODS.GET, schema: listCustomersSchema, preHandler: admin, handler: customersController.list },
  { url: "/:id", method: API_METHODS.GET, schema: getCustomerSchema, preHandler: admin, handler: customersController.get },
];

export default routes;
