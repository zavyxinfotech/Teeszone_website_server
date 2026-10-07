import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import uploadController from "./upload.controller";
import { uploadImageSchema } from "./upload.schema";

const routes: IRouteOptions[] = [
  {
    url: "/image",
    method: API_METHODS.POST,
    schema: uploadImageSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: uploadController.image,
  },
  {
    url: "/media/*",
    method: API_METHODS.GET,
    handler: uploadController.media,
  },
];

export default routes;
