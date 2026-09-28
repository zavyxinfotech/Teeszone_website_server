import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { authMiddleware } from "../../middleware/auth.middleware";
import addressesController from "./addresses.controller";
import {
  createAddressSchema,
  deleteAddressSchema,
  listAddressesSchema,
  updateAddressSchema,
} from "./addresses.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/", method: API_METHODS.GET, schema: listAddressesSchema, preHandler: [authMiddleware], handler: addressesController.list },
  { url: "/", method: API_METHODS.POST, schema: createAddressSchema, preHandler: [authMiddleware], handler: addressesController.create },
  { url: "/:id", method: API_METHODS.PUT, schema: updateAddressSchema, preHandler: [authMiddleware], handler: addressesController.update },
  { url: "/:id", method: API_METHODS.DELETE, schema: deleteAddressSchema, preHandler: [authMiddleware], handler: addressesController.remove },
];

export default routes;
