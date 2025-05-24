import IoRedis from "ioredis";
import type { RedisCommander } from "ioredis";
import redisConfig from "../variables/redisConfig.js";
import EventEmitter from "events";
import { consoleLogProduction } from "./logger.js";

class Publisher {
	static #_instance: Publisher;

	#publisher: IoRedis;

	// number of errors occurred
	#errors: { [key: string]: number } = {};

	// notifies admin about Redis crash after nth try to recconect
	#notifyAfterNTries: number = 20;

	constructor() {
		this.#publisher = new IoRedis(redisConfig);
		this.#publisher.on("error", (error: any) => {
			console.log(error);
			console.log(this.#errors);

			// * more info about errors and reconnection: https://github.com/redis/ioredis#auto-reconnect
			// * redis tries to reconnect automatically infinitely

			// this microservice should be changed to `healthCheck` microservice instead of `globalData`
			// check Redis connection only here and on this microservice so we don't get multiple notifications
			if (process.env.MICROSERVICE_NAME !== "globalData") return;

			if (!(error.code in this.#errors)) {
				this.#errors[error.code] = 0;
			}
			if (this.#errors[error.code] <= this.#notifyAfterNTries)
				this.#errors[error.code]++;

			if (error.code === "ECONNREFUSED") {
				let disconnectedMessage = `Microservice '${process.env.MICROSERVICE_NAME}' can't connect to Redis!`;
				if (this.#errors[error.code] === this.#notifyAfterNTries) {
					// ! there should also be some kind of notification for programmers in here about redis not working
					consoleLogProduction(disconnectedMessage, "error");
				}
			}
		});
		this.#publisher.on("connect", () => {
			this.#errors = {};

			consoleLogProduction("Publisher service connected", "success");
		});
	}

	static getInstance(): Publisher {
		if (!Publisher.#_instance) {
			Publisher.#_instance = new Publisher();
		}
		return Publisher.#_instance;
	}

	/**
	 *
	 * @param channel
	 * @param message
	 * @param callback
	 * @returns number of subscribers to this channel
	 */
	async publish<Type extends Parameters<RedisCommander["publish"]>>(
		channel: Type[0],
		message: Type[1],
		callback?: Type[2]
	) {
		let args = [...arguments] as Parameters<RedisCommander["publish"]>;

		return await this.#publisher.publish(...args);
	}

	on<Type extends Parameters<EventEmitter["on"]>>(
		event: Type[0],
		listener: Type[1]
	) {
		return this.#publisher.on(event, listener);
	}
}

export default Publisher.getInstance();
