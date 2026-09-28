import { createClient } from "redis";
import { config } from "../config";
import logger from "./logger";

const redisClient = createClient({
  url: config.redis_url,
  socket: config.redis_url.startsWith("rediss:") ? { tls: true } : undefined,
});

let ready = false;

redisClient.on("error", (err) => {
  if (ready) logger.warn({ err }, "Redis client error");
  ready = false;
});
redisClient.on("ready", () => {
  ready = true;
  logger.info("Redis connected");
});

redisClient.connect().catch((err) => {
  logger.warn({ err }, "Redis unreachable — cooldown/cache disabled");
});

export const isRedisReady = () => ready;
export default redisClient;
