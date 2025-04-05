import IoRedis from "ioredis";
import type { RedisCommander } from "ioredis";
import redisConfig from "../variables/redisConfig.js";
import EventEmitter from "events";
import { log } from "./logger.js";

class Subscriber {
	static #_instance: Subscriber;

	#subscriber;

	constructor() {
		this.#subscriber = new IoRedis(redisConfig);
		this.#subscriber.on("connect", () => {
			log({
				message: `Subscriber service connected`,
				type: "consoleLogProduction",
				status: "success",
			});
		});
		this.#subscriber.on("error", () => {
			// For now just to catch the error so it doesn't pollute terminal.
			// Can be extended for `subscriber` errors
			// Connection error of Redis is resolved in `publisherService.ts`
		});
	}

	static getInstance(): Subscriber {
		if (!Subscriber.#_instance) {
			Subscriber.#_instance = new Subscriber();
		}
		return Subscriber.#_instance;
	}

	subscribe<Type extends Parameters<RedisCommander["subscribe"]>>(
		...args: Type
	) {
		return this.#subscriber.subscribe(...args);
	}

	/**
	 *
	 * @param args arguments:
	 * - `pattern` regex channel
	 * - callback
	 * @returns number of channels this client is currently subscribed to.
	 */
	psubscribe<Type extends Parameters<RedisCommander["psubscribe"]>>(
		...args: Type
	) {
		return this.#subscriber.psubscribe(...args);
	}

	on<Type extends Parameters<EventEmitter["on"]>>(
		event: Type[0],
		listener: Type[1]
	) {
		return this.#subscriber.on(event, listener);
	}
	off<Type extends Parameters<EventEmitter["off"]>>(
		event: Type[0],
		listener: Type[1]
	) {
		return this.#subscriber.off(event, listener);
	}
}

export default Subscriber.getInstance();
