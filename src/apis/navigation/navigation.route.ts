import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import navigationController from "./navigation.controller";
import { getNavigationSchema } from "./navigation.schema";

const routes: IRouteOptions[] = [
  {
    url: "/",
    method: API_METHODS.GET,
    schema: getNavigationSchema,
    handler: navigationController.get,
  },
];

export default routes;
