import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { authMiddleware } from "../../middleware/auth.middleware";
import cartController from "./cart.controller";
import { syncCartSchema, updateQtySchema, removeItemSchema } from "./cart.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  {
    url: "/",
    method: API_METHODS.GET,
    preHandler: [authMiddleware],
    handler: cartController.getMyCart,
  },
  {
    url: "/sync",
    method: API_METHODS.POST,
    schema: syncCartSchema,
    preHandler: [authMiddleware],
    handler: cartController.syncCart,
  },
  {
    url: "/update-qty",
    method: API_METHODS.PUT,
    schema: updateQtySchema,
    preHandler: [authMiddleware],
    handler: cartController.updateQty,
  },
  {
    url: "/remove",
    method: API_METHODS.DELETE,
    schema: removeItemSchema,
    preHandler: [authMiddleware],
    handler: cartController.removeItem,
  },
  {
    url: "/clear",
    method: API_METHODS.DELETE,
    preHandler: [authMiddleware],
    handler: cartController.clearCart,
  },
];

export default routes;
