import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import collectionsController from "./collections.controller";
import {
  adminListCollectionsSchema,
  createCollectionSchema,
  deleteCollectionSchema,
  getCollectionSchema,
  listCollectionsSchema,
  updateCollectionSchema,
} from "./collections.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/", method: API_METHODS.GET, schema: listCollectionsSchema, handler: collectionsController.list },
  {
    url: "/admin/list",
    method: API_METHODS.GET,
    schema: adminListCollectionsSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: collectionsController.adminList,
  },
  { url: "/:slug", method: API_METHODS.GET, schema: getCollectionSchema, handler: collectionsController.getBySlug },
  {
    url: "/",
    method: API_METHODS.POST,
    schema: createCollectionSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: collectionsController.create,
  },
  {
    url: "/:id",
    method: API_METHODS.PUT,
    schema: updateCollectionSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: collectionsController.update,
  },
  {
    url: "/:id",
    method: API_METHODS.DELETE,
    schema: deleteCollectionSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: collectionsController.remove,
  },
];

export default routes;
