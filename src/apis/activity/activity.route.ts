import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { optionalAuthMiddleware } from "../../middleware/optional-auth.middleware";
import activityController from "./activity.controller";
import { logActivitySchema, listActivitiesSchema } from "./activity.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  {
    url: "/",
    method: API_METHODS.POST,
    schema: logActivitySchema,
    preHandler: [optionalAuthMiddleware],
    handler: activityController.logActivity,
  },
  {
    url: "/",
    method: API_METHODS.GET,
    schema: listActivitiesSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: activityController.adminList,
  },
];

export default routes;
