import { API_METHODS } from "../../interface/api.interface";
import { IRouteOptions } from "../../interface/fastify.interface";
import { authMiddleware } from "../../middleware/auth.middleware";
import authController from "./auth.controller";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleSchema,
  loginSchema,
  meSchema,
  registerSchema,
  resetPasswordSchema,
  updateMeSchema,
} from "./auth.schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const routes: IRouteOptions<any>[] = [
  { url: "/register", method: API_METHODS.POST, schema: registerSchema, handler: authController.register },
  { url: "/login", method: API_METHODS.POST, schema: loginSchema, handler: authController.login },
  { url: "/google", method: API_METHODS.POST, schema: googleSchema, handler: authController.google },
  { url: "/forgot-password", method: API_METHODS.POST, schema: forgotPasswordSchema, handler: authController.forgotPassword },
  { url: "/reset-password", method: API_METHODS.POST, schema: resetPasswordSchema, handler: authController.resetPassword },
  { url: "/me", method: API_METHODS.GET, schema: meSchema, preHandler: [authMiddleware], handler: authController.me },
  { url: "/me", method: API_METHODS.PATCH, schema: updateMeSchema, preHandler: [authMiddleware], handler: authController.updateMe },
  { url: "/change-password", method: API_METHODS.POST, schema: changePasswordSchema, preHandler: [authMiddleware], handler: authController.changePassword },
];

export default routes;
