import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import newsletterController from "./newsletter.controller";
import { listSubscribersSchema, subscribeSchema } from "./newsletter.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/", method: API_METHODS.POST, schema: subscribeSchema, handler: newsletterController.subscribe },
  {
    url: "/",
    method: API_METHODS.GET,
    schema: listSubscribersSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: newsletterController.list,
  },
];

export default routes;
