import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import customizationController from "./customization.controller";
import {
  adminDeleteCustomizationModelSchema,
  adminListCustomizationModelsSchema,
  adminUpload3DModelSchema,
  adminUpsertCustomizationModelSchema,
  getCustomizationModelsSchema,
} from "./customization.schema";

const routes: IRouteOptions<any>[] = [
  // Public route to get all active 3D models for frontend customization studio
  {
    url: "/3d-models",
    method: API_METHODS.GET,
    schema: getCustomizationModelsSchema,
    handler: customizationController.getActive,
  },
  // Admin list all models
  {
    url: "/admin/3d-models",
    method: API_METHODS.GET,
    schema: adminListCustomizationModelsSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: customizationController.adminList,
  },
  // Admin upsert model
  {
    url: "/admin/3d-models",
    method: API_METHODS.POST,
    schema: adminUpsertCustomizationModelSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: customizationController.adminUpsert,
  },
  // Admin delete model
  {
    url: "/admin/3d-models/:id",
    method: API_METHODS.DELETE,
    schema: adminDeleteCustomizationModelSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: customizationController.adminDelete,
  },
  // Admin upload front/back 3D model PNG directly to S3
  {
    url: "/admin/upload-3d-model",
    method: API_METHODS.POST,
    schema: adminUpload3DModelSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: customizationController.adminUpload,
  },
];

export default routes;
