import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import paymentsController from "./payments.controller";
import { createOrderSchema, verifyPaymentSchema } from "./payments.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  {
    url: "/create-order",
    method: API_METHODS.POST,
    schema: createOrderSchema,
    handler: paymentsController.createOrder,
  },
  {
    url: "/verify-payment",
    method: API_METHODS.POST,
    schema: verifyPaymentSchema,
    handler: paymentsController.verifyPayment,
  },
];

export default routes;
