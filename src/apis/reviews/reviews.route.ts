import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import reviewsController from "./reviews.controller";
import {
  adminListReviewsSchema,
  createReviewSchema,
  deleteReviewSchema,
  listReviewsSchema,
  updateReviewSchema,
} from "./reviews.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/", method: API_METHODS.GET, schema: listReviewsSchema, handler: reviewsController.list },
  {
    url: "/admin/list",
    method: API_METHODS.GET,
    schema: adminListReviewsSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: reviewsController.adminList,
  },
  {
    url: "/",
    method: API_METHODS.POST,
    schema: createReviewSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: reviewsController.create,
  },
  {
    url: "/:id",
    method: API_METHODS.PUT,
    schema: updateReviewSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: reviewsController.update,
  },
  {
    url: "/:id",
    method: API_METHODS.DELETE,
    schema: deleteReviewSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: reviewsController.remove,
  },
];

export default routes;
