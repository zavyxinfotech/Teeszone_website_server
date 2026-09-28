import crypto from "crypto";
import App from "./app";
import { config } from "./config";

const app = new App({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  genReqId: (request: any) => (request.id = crypto.randomUUID()),
  bodyLimit: 30 * 1024 * 1024,
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "yyyy-mm-dd HH:MM:ss.l o",
        ignore: "pid,hostname",
      },
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const start = async () => {
  try {
    await app.connectPrisma();
    app.log.info("TeesZone API — database connected");
  } catch (error) {
    app.log.warn(`Database not reachable — fill backend/.env and restart. (${error})`);
  }

  app.listen({ port: config.port, host: "0.0.0.0" }, (err) => {
    if (err) {
      app.log.error(`[ERROR] TeesZone API failed to start - ${err}`);
      process.exit(1);
    }
    app.log.info(`Server listening on port ${config.port}`);
  });
};

start();

const gracefulShutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down gracefully...`);
  try {
    await app.close();
  } finally {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  app.log.error(`uncaughtException: ${error?.stack || error}`);
});
process.on("unhandledRejection", (reason) => {
  app.log.error(`unhandledRejection: ${reason}`);
});
