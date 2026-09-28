import Autoload from "@fastify/autoload";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastify, {
  FastifyInstance,
  FastifyListenOptions,
  FastifyServerOptions,
} from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import path from "path";
import { config, fmt } from "./config";
import { swaggerConfig, swaggerUiConfig } from "./config/swagger.config";
import { captureRequestError } from "./utils/error-tracking";
import { rTracerPlugin } from "./utils/logger";
import client from "./utils/prisma";
import redisClient from "./utils/redis";

type ListenCallbackFunction = (err: Error | null, address: string) => void;

class App {
  private fastifyInstance: FastifyInstance;

  constructor(opts: FastifyServerOptions) {
    this.fastifyInstance = fastify(opts);
    this.initializeZod();
    this.initializeSwagger();
    this.initializeErrorHandler();
    this.initializePreHandlers();
    this.initializeRoutes();
  }

  public get log() {
    return this.fastifyInstance.log;
  }

  public getFastifyInstance() {
    return this.fastifyInstance;
  }

  private initializeZod() {
    this.fastifyInstance.setValidatorCompiler(validatorCompiler);
    this.fastifyInstance.setSerializerCompiler(serializerCompiler);
  }

  private initializeSwagger() {
    this.fastifyInstance.register(fastifySwagger, swaggerConfig);
    this.fastifyInstance.register(fastifySwaggerUi, {
      ...swaggerUiConfig,
      routePrefix: "/api/docs",
    });
  }

  private initializeErrorHandler() {
    this.fastifyInstance.setErrorHandler((error, request, reply) => {
      captureRequestError(error, request);
      const formatted = fmt.formatError(error);
      const { status, ...errorResponse } = formatted;
      reply.status(status).send(errorResponse);
    });
  }

  private initializePreHandlers() {
    this.fastifyInstance.register(fastifyMultipart, {
      attachFieldsToBody: true,
      limits: { fileSize: 30 * 1024 * 1024, files: 5 },
    });
    this.fastifyInstance.register(cors, {
      origin: config.cors_origins,
      credentials: false,
    });
    this.fastifyInstance.register(rTracerPlugin, {
      echoHeader: true,
      useFastifyRequestId: true,
    });
    this.fastifyInstance.register(fastifyJwt, { secret: config.jwt_secret });
  }

  private initializeRoutes() {
    this.fastifyInstance.register(Autoload, {
      options: { prefix: "/api" },
      dir: path.join(__dirname, "apis"),
    });
  }

  public connectPrisma() {
    this.fastifyInstance.addHook("onClose", async () => {
      await client.$disconnect();
    });
    return client.$connect();
  }

  public async close() {
    await this.fastifyInstance.close();
    if (redisClient.isOpen) await redisClient.quit().catch(() => undefined);
  }

  public listen(opts: FastifyListenOptions, cb: ListenCallbackFunction) {
    this.fastifyInstance.listen(opts, cb);
  }
}

export default App;
