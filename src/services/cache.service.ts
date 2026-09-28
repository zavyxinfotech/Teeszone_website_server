import redisClient, { isRedisReady } from "../utils/redis";
import logger from "../utils/logger";

const PREFIX = "catalog:";
const TTL_SECONDS = 60;

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!isRedisReady()) return null;
  try {
    const value = await redisClient.get(`${PREFIX}${key}`);
    return value ? (JSON.parse(value) as T) : null;
  } catch (err) {
    logger.warn({ err, key }, "cacheGet failed");
    return null;
  }
};

export const cacheSet = async (key: string, value: unknown): Promise<void> => {
  if (!isRedisReady()) return;
  try {
    await redisClient.setEx(`${PREFIX}${key}`, TTL_SECONDS, JSON.stringify(value));
  } catch (err) {
    logger.warn({ err, key }, "cacheSet failed");
  }
};

export const cacheInvalidate = async (): Promise<void> => {
  if (!isRedisReady()) return;
  try {
    for await (const key of redisClient.scanIterator({ MATCH: `${PREFIX}*`, COUNT: 100 })) {
      await redisClient.del(key);
    }
  } catch (err) {
    logger.warn({ err }, "cacheInvalidate failed");
  }
};
