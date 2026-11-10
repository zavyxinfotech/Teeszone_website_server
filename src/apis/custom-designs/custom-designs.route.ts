import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { authMiddleware } from "../../middleware/auth.middleware";
import customDesignsController from "./custom-designs.controller";
import { saveCustomDesignSchema } from "./custom-designs.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  {
    url: "/",
    method: API_METHODS.GET,
    preHandler: [authMiddleware],
    handler: customDesignsController.getMyDesigns,
  },
  {
    url: "/:productSlug",
    method: API_METHODS.GET,
    preHandler: [authMiddleware],
    handler: customDesignsController.getDesignBySlug,
  },
  {
    url: "/",
    method: API_METHODS.POST,
    schema: saveCustomDesignSchema,
    preHandler: [authMiddleware],
    handler: customDesignsController.saveDesign,
  },
  {
    url: "/:productSlug",
    method: API_METHODS.DELETE,
    preHandler: [authMiddleware],
    handler: customDesignsController.deleteDesign,
  },
];

export default routes;
