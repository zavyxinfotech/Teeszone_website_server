import {
  FastifyReply,
  FastifyRequest,
  RouteGenericInterface,
  preHandlerHookHandler,
} from "fastify";
import { API_METHODS } from "./api.interface";

export interface IRouteOptions<T extends RouteGenericInterface = RouteGenericInterface> {
  url: string;
  method: API_METHODS;
  schema?: Record<string, unknown>;
  preHandler?: preHandlerHookHandler | preHandlerHookHandler[];
  handler: (req: FastifyRequest<T>, reply: FastifyReply) => Promise<unknown> | unknown;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: { userId: string };
  }
}
