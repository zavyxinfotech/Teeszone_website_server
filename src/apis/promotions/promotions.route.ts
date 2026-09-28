import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import promotionsController from "./promotions.controller";
import {
  adminGetPromotionSchema,
  adminListPromotionsSchema,
  createPromotionSchema,
  deletePromotionSchema,
  listPromotionsSchema,
  updatePromotionSchema,
  validatePromotionSchema,
} from "./promotions.schema";

const admin = [authMiddleware, adminMiddleware];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/", method: API_METHODS.GET, schema: listPromotionsSchema, handler: promotionsController.list },
  { url: "/validate", method: API_METHODS.POST, schema: validatePromotionSchema, handler: promotionsController.validate },
  { url: "/admin/list", method: API_METHODS.GET, schema: adminListPromotionsSchema, preHandler: admin, handler: promotionsController.adminList },
  { url: "/admin/:id", method: API_METHODS.GET, schema: adminGetPromotionSchema, preHandler: admin, handler: promotionsController.adminGet },
  { url: "/", method: API_METHODS.POST, schema: createPromotionSchema, preHandler: admin, handler: promotionsController.create },
  { url: "/:id", method: API_METHODS.PUT, schema: updatePromotionSchema, preHandler: admin, handler: promotionsController.update },
  { url: "/:id", method: API_METHODS.DELETE, schema: deletePromotionSchema, preHandler: admin, handler: promotionsController.remove },
];

export default routes;
