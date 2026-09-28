import { SwaggerOptions } from "@fastify/swagger";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export const swaggerConfig: SwaggerOptions = {
  openapi: {
    info: {
      title: "TeesZone API",
      description: "TeesZone e-commerce backend — catalog, enquiries, admin",
      version: "1.0.0",
    },
    tags: [
      { name: "Health", description: "Health check" },
      { name: "Catalog", description: "Public catalog: navigation, collections, products, fabrics, reviews" },
      { name: "Enquiries", description: "Quote enquiries" },
      { name: "Newsletter", description: "Newsletter signups" },
      { name: "Auth", description: "Admin OTP login" },
      { name: "Admin", description: "Admin CRUD (JWT required)" },
      { name: "Upload", description: "Image uploads (JWT required)" },
    ],
    components: {
      securitySchemes: {
        ApiToken: {
          description: 'Authorization header token, sample: "Bearer #TOKEN#"',
          type: "apiKey",
          name: "authorization",
          in: "header",
        },
      },
    },
  },
  transform: jsonSchemaTransform,
};

export const swaggerUiConfig = {
  uiConfig: { docExpansion: "list" as const, deepLinking: false },
  staticCSP: true,
};
