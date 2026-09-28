import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import productsController from "./products.controller";
import {
  adminGetProductSchema,
  adminListProductsSchema,
  createProductSchema,
  deleteProductSchema,
  getProductSchema,
  listProductsSchema,
  updateProductSchema,
} from "./products.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/", method: API_METHODS.GET, schema: listProductsSchema, handler: productsController.list },
  {
    url: "/admin/list",
    method: API_METHODS.GET,
    schema: adminListProductsSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: productsController.adminList,
  },
  {
    url: "/admin/:id",
    method: API_METHODS.GET,
    schema: adminGetProductSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: productsController.adminGet,
  },
  { url: "/:slug", method: API_METHODS.GET, schema: getProductSchema, handler: productsController.getBySlug },
  {
    url: "/",
    method: API_METHODS.POST,
    schema: createProductSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: productsController.create,
  },
  {
    url: "/:id",
    method: API_METHODS.PUT,
    schema: updateProductSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: productsController.update,
  },
  {
    url: "/:id",
    method: API_METHODS.DELETE,
    schema: deleteProductSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: productsController.remove,
  },
];

export default routes;
