import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import likesController from "./likes.controller";
import {
  adminListLikesSchema,
  getMyLikesSchema,
  toggleLikeSchema,
} from "./likes.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  {
    url: "/",
    method: API_METHODS.GET,
    schema: getMyLikesSchema,
    preHandler: [authMiddleware],
    handler: likesController.getMyLikes,
  },
  {
    url: "/toggle",
    method: API_METHODS.POST,
    schema: toggleLikeSchema,
    preHandler: [authMiddleware],
    handler: likesController.toggleLike,
  },
  {
    url: "/admin/list",
    method: API_METHODS.GET,
    schema: adminListLikesSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: likesController.adminList,
  },
];

export default routes;
