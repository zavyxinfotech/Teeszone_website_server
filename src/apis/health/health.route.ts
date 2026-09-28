import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import healthController from "./health.controller";
import { healthSchema } from "./health.schema";

const routes: IRouteOptions[] = [
  {
    url: "/",
    method: API_METHODS.GET,
    schema: healthSchema,
    handler: healthController.check,
  },
];

export default routes;
