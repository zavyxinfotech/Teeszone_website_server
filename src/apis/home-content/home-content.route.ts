import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import homeContentController from "./home-content.controller";
import { getHomeContentSchema, updateHomeContentSchema } from "./home-content.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  {
    url: "/",
    method: API_METHODS.GET,
    schema: getHomeContentSchema,
    handler: homeContentController.get,
  },
  {
    url: "/",
    method: API_METHODS.PUT,
    schema: updateHomeContentSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: homeContentController.update,
  },
];

export default routes;
