import IoRedis from "ioredis";
import redisConfig from "../variables/redisConfig.js";

class Redis {
	static #ioRedis: IoRedis;

	static ioRedis(): IoRedis {
		if (!Redis.#ioRedis) {
			Redis.#ioRedis = new IoRedis(redisConfig);
		}
		return Redis.#ioRedis;
	}
}

export default Redis.ioRedis();
