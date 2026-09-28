import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { authMiddleware } from "../../middleware/auth.middleware";
import enquiriesController from "./enquiries.controller";
import {
  createEnquirySchema,
  listEnquiriesSchema,
  updateEnquirySchema,
} from "./enquiries.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/", method: API_METHODS.POST, schema: createEnquirySchema, handler: enquiriesController.create },
  {
    url: "/",
    method: API_METHODS.GET,
    schema: listEnquiriesSchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: enquiriesController.list,
  },
  {
    url: "/:id",
    method: API_METHODS.PATCH,
    schema: updateEnquirySchema,
    preHandler: [authMiddleware, adminMiddleware],
    handler: enquiriesController.updateStatus,
  },
];

export default routes;
