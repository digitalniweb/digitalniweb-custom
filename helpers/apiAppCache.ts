import { msCallOptions } from "~/digitalniweb-types/custom/helpers/remoteProcedureCall";
import appCache from "./appCache";
import axios from "axios";

type apiCacheMainKey = "apiCacheGetData" | "apiCacheMsAllId";
/**
 * Caches these type of data:
 *
 * -	GET requests response data
 * -	key: `apiCacheGetData`
 *
 * -	Save 'scoped' = 'all' request's microservice ID of the request
 * -	key: `apiCacheMsAllId`
 */
export class ApiAppCache {
	static #_instance: ApiAppCache;
	static getInstance() {
		if (!ApiAppCache.#_instance) {
			ApiAppCache.#_instance = new ApiAppCache();
		}
		return ApiAppCache.#_instance;
	}
	has(options: msCallOptions) {
		if (!options.protocol || !["http", "https"].includes(options.protocol))
			return "";
		let key = this.createKey(options);
		if (!key) return false;
		return appCache.has(key);
	}
	get(options: msCallOptions) {
		if (options.protocol && !["http", "https"].includes(options.protocol))
			return "";
		let key = this.createKey(options);
		if (!key) return false;
		return appCache.get(key);
	}
	createKey(options: msCallOptions): string {
		let mainKey = this.createMainKey(options.scope);
		if (mainKey === false) return "";
		let otherKeys = [];
		if (mainKey === "apiCacheGetData") {
			// creates parameters (after '?' e.g.'?id=1') for GET requests
			let urlParamsString = axios.getUri({
				url: "",
				params: { ...options.data, ...options.params },
			});
			otherKeys.push(urlParamsString);
		} else if (mainKey === "apiCacheMsAllId") {
		}
		otherKeys.push(options.protocol, options.name, options.id);

		let key = appCache.createKey(mainKey, otherKeys);
		return key;
	}
	createMainKey(
		scope: msCallOptions["scope"] = "single"
	): apiCacheMainKey | false {
		if (scope === "single") return "apiCacheGetData";
		else if (scope === "all") return "apiCacheMsAllId";
		return false;
	}
}

export default ApiAppCache.getInstance();
