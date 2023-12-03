import {
	appCallOptions,
	msCallOptions,
	apiAppCacheType,
} from "../../digitalniweb-types/custom/helpers/remoteProcedureCall";
import appCache from "./appCache.js";
import axios from "axios";

type apiCacheMainKey = "apiCacheGetData" | "apiCacheMsAll";
/**
 * Caches these type of data:
 *
 * -	GET requests response data
 * -	key: `apiCacheGetData`
 *
 * -	Save 'scoped' = 'all' request's microservice ID of the request
 * -	key: `apiCacheMsAll`
 */
export class ApiAppCache {
	static #_instance: ApiAppCache;
	private shardIdTtl: number = 120;

	static getInstance() {
		if (!ApiAppCache.#_instance) {
			ApiAppCache.#_instance = new ApiAppCache();
		}
		return ApiAppCache.#_instance;
	}
	has(options: msCallOptions | appCallOptions) {
		if (!options.protocol || !["http", "https"].includes(options.protocol))
			return "";
		let key = this.createKey(options);
		if (!key) return false;
		return appCache.has(key);
	}
	get(
		options: msCallOptions | appCallOptions,
		type: apiAppCacheType = "data"
	) {
		if (options.protocol && !["http", "https"].includes(options.protocol))
			return "";
		let key = this.createKey(options);

		if (!key) return false;
		if (type === "data") return appCache.get(key);
		else if (type === "shardId") {
			let shardId = appCache.get(key);
			if (shardId) {
				// refresh ttl
				appCache.ttl(key, this.shardIdTtl);
				return shardId;
			}
		}
		return false;
	}
	/**
	 *
	 * @param key should be created via `this.createKey()`, might be whatever though but be aware it shares `appCache` data
	 * @param value
	 * @returns
	 */
	set(key: string, value: any, type: apiAppCacheType = "data") {
		if (!key) return false;
		if (type === "data") {
			return appCache.set(key, value);
		} else if (type === "shardId") {
			// save shard id for longer period of time. And reset timer if still valid when getting it.
			return appCache.set(key, value, type, this.shardIdTtl);
		}
		return;
	}

	resetShardIdTtl(key: string) {
		return appCache.ttl(key, this.shardIdTtl);
	}

	createKey(
		options: msCallOptions | appCallOptions,
		type: apiAppCacheType = "data"
	): string {
		if (type === "data" && options.method != "GET") return "";
		if (options.protocol && !["http", "https"].includes(options.protocol))
			return "";
		let mainKey = this.createMainKey(options.scope);
		if (mainKey === false) return "";
		let otherKeys = [];
		if (type === "data") {
			// creates parameters (after '?' e.g.'?id=1') for GET requests
			let urlParamsString = axios.getUri({
				url: "",
				params: { ...options.data, ...options.params },
			});
			otherKeys.push(urlParamsString);
		} else if (mainKey === "apiCacheMsAll") {
			// get shardId
			otherKeys.push("shardId");
		} else return "";
		otherKeys.unshift(
			options.name,
			options.protocol,
			options.path,
			options.id
		);

		let key = appCache.createKey(mainKey, otherKeys);
		return key;
	}
	createMainKey(
		scope: (msCallOptions | appCallOptions)["scope"] = "single"
	): apiCacheMainKey | false {
		if (scope === "single") return "apiCacheGetData";
		else if (scope === "all") return "apiCacheMsAll";
		return false;
	}
}

export default ApiAppCache.getInstance();
