import IoRedis from "ioredis";
import type { RedisKey, Callback, RedisValue, RedisCommander } from "ioredis";
import redisConfig from "../variables/redisConfig.js";
import { consoleLogProduction } from "./logger.js";

class ServerCache {
	static #_instance: ServerCache;

	#cache: IoRedis;

	// number of errors occurred
	// #errors: { [key: string]: number } = {};

	// if IoRedis is not disconnected, then it tries to connect to Redis indefinitely
	// #disconnectOnCrash: boolean = false;
	// #disconnectNumberOfTries: number = 20;

	constructor() {
		// https://www.javatpoint.com/redis-all-commands (redis commands(not IoRedis'))
		this.#cache = new IoRedis(redisConfig);

		this.#cache.on("connect", () => {
			consoleLogProduction(
				`Redis connected to '${process.env.MICROSERVICE_NAME}'`,
				"success"
			);
		});

		this.#cache.on("error", () => {
			// For now just to catch the error so it doesn't pollute terminal.
			// Can be extended for `cache` errors
			// Connection error of Redis is resolved in `publisherService.ts`
		});
	}

	async connect() {
		try {
			await this.#cache.connect();
		} catch (error) {
			consoleLogProduction(
				error,
				"error",
				`Microservice '${process.env.MICROSERVICE_NAME}' couldn't connect to Redis!`
			);
		}
	}

	static getInstance(): ServerCache {
		if (!ServerCache.#_instance) {
			ServerCache.#_instance = new ServerCache();
		}
		return ServerCache.#_instance;
	}

	async get(key: RedisKey, callback?: Callback) {
		let args = [...arguments] as Parameters<RedisCommander["get"]>;
		return await this.#cache.get(...args);
	}

	async set(key: RedisKey, value: RedisValue, callback?: Callback) {
		let args = [...arguments] as Parameters<RedisCommander["set"]>;
		return await this.#cache.set(...args);
	}

	async mset(object: object, callback?: Callback) {
		let args = [...arguments] as Parameters<RedisCommander["mset"]>;
		return await this.#cache.mset(...args);
	}
	async hset(
		key: RedisKey,
		hashKey: string | number,
		...fields: (RedisKey | number)[]
	) {
		let args = [...arguments] as Parameters<RedisCommander["hset"]>;
		return await this.#cache.hset(...args);
	}
	async hmset(key: RedisKey, object: object, callback?: Callback) {
		let args = [...arguments] as Parameters<RedisCommander["hmset"]>;
		return await this.#cache.hmset(...args);
	}

	async hget(key: RedisKey, field: RedisKey, callback?: Callback) {
		let args = [...arguments] as Parameters<RedisCommander["hget"]>;
		return await this.#cache.hget(...args);
	}

	async hmget(key: RedisKey, ...fields: RedisKey[]) {
		let args = [...arguments] as Parameters<RedisCommander["hmget"]>;
		return await this.#cache.hmget(...args);
	}

	async hgetall(key: RedisKey, callback?: Callback) {
		let args = [...arguments] as Parameters<RedisCommander["hgetall"]>;
		return await this.#cache.hgetall(...args);
	}

	async hdel(key: RedisKey, ...fields: RedisKey[]) {
		let args = [...arguments] as Parameters<RedisCommander["hdel"]>;
		return await this.#cache.hdel(...args);
	}
}

export default ServerCache.getInstance();
