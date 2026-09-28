import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import fabricsController from "./fabrics.controller";
import {
  adminListFabricsSchema,
  createFabricSchema,
  deleteFabricSchema,
  listFabricsSchema,
  updateFabricSchema,
} from "./fabrics.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/", method: API_METHODS.GET, schema: listFabricsSchema, handler: fabricsController.list },
  {
    url: "/admin/list",
    method: API_METHODS.GET,
    schema: adminListFabricsSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: fabricsController.adminList,
  },
  {
    url: "/",
    method: API_METHODS.POST,
    schema: createFabricSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: fabricsController.create,
  },
  {
    url: "/:id",
    method: API_METHODS.PUT,
    schema: updateFabricSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: fabricsController.update,
  },
  {
    url: "/:id",
    method: API_METHODS.DELETE,
    schema: deleteFabricSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: fabricsController.remove,
  },
];

export default routes;
