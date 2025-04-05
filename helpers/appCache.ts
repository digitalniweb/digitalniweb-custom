import NodeCache from "node-cache";
import type { appCacheType } from "./../../digitalniweb-types";
import type { cacheKey } from "./../../digitalniweb-types/custom/helpers/remoteProcedureCall";

class AppCache {
	static #_instance: AppCache;

	#cache;
	#keySeparator = "#|";

	constructor(ttlSeconds: number = 20) {
		this.#cache = new NodeCache({
			stdTTL: ttlSeconds,
			checkperiod: ttlSeconds * 0.2,
			useClones: false,
		});
	}

	static getInstance() {
		if (!AppCache.#_instance) {
			AppCache.#_instance = new AppCache(300);
		}
		return AppCache.#_instance;
	}

	get(key?: cacheKey): any {
		if (!key) return;
		let finalKey = this.createKey(key);
		return this.#cache.get(finalKey);
	}

	/**
	 *
	 * @param key
	 * @param value
	 * @param namespace
	 * @param ttl time to live in seconds
	 */
	set(key: cacheKey, value: any, ttl?: number) {
		let finalKey = this.createKey(key);
		this.#cache.set(finalKey, value);
		if (ttl) this.#cache.ttl(finalKey, ttl);
	}

	has(key: cacheKey): boolean {
		let finalKey = this.createKey(key);
		return this.#cache.has(finalKey);
	}

	/**
	 *
	 * @param key
	 * @param ttl time to live. 0 deletes this key!
	 * @returns
	 */
	ttl(key: string, ttl: number): boolean {
		return this.#cache.ttl(key, ttl);
	}

	del(key: cacheKey) {
		let finalKey = this.createKey(key);
		this.#cache.del(finalKey);
	}
	keys() {
		return this.#cache.keys();
	}

	createKey(key?: cacheKey): string {
		if (!key) return "";
		if (typeof key === "string") return key;
		else if (Array.isArray(key)) {
			return key.join(this.#keySeparator);
		}

		// assure order
		const sortedKeys = Object.keys(key).sort() as (keyof appCacheType)[];
		const sortedObj = {} as appCacheType;
		sortedKeys.forEach((propKey) => {
			(sortedObj as any)[propKey] = key[propKey];
		});

		return Object.values(sortedObj).join(this.#keySeparator);
	}
}

export default AppCache.getInstance();
