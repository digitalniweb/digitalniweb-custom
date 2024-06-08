import IoRedis from "ioredis";
import redis from "../../server/config/redisClient.js";

class Redis {
    static #ioRedis: IoRedis;

    static ioRedis(): IoRedis {
        if (!Redis.#ioRedis) {
            Redis.#ioRedis = redis;
        }
        return Redis.#ioRedis;
    }
}

export default Redis.ioRedis();
