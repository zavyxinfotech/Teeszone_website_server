import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import dashboardController from "./dashboard.controller";
import { dashboardStatsSchema } from "./dashboard.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  {
    url: "/stats",
    method: API_METHODS.GET,
    schema: dashboardStatsSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: dashboardController.stats,
  },
];

export default routes;
