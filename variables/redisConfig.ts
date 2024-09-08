import dotenv from "dotenv";
import { RedisOptions } from "ioredis";
dotenv.config();

const redisConfig = {
	host: process.env.REDIS_HOST || "127.0.0.1",
	port: process.env.REDIS_PORT || 6379,
} as RedisOptions;

export default redisConfig;
