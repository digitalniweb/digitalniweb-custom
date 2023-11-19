import NodeCache from "node-cache";
import isArray from "../functions/isArray.js";

type namespace = string | Array<string | number> | undefined;
class AppCache {
	static #_instance: AppCache;

	#cache;
	#namespaceSeparator = "###";

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

	get(key: string, namespace?: namespace): any {
		let finalKey = this.createKey(key, namespace);
		return this.#cache.get(finalKey);
	}

	set(key: string, value: any, namespace?: namespace) {
		let finalKey = this.createKey(key, namespace);
		this.#cache.set(finalKey, value);
	}

	has(key: string, namespace?: namespace): boolean {
		let finalKey = this.createKey(key, namespace);
		return this.#cache.has(finalKey);
	}

	del(key: string, namespace?: namespace) {
		let finalKey = this.createKey(key, namespace);
		this.#cache.del(finalKey);
	}
	keys() {
		return this.#cache.keys();
	}

	createKey(key: string, namespace?: namespace): string {
		if (namespace === undefined) return key;
		key = this.#namespaceSeparator + key;
		let namespaceIsArray = isArray(namespace);
		if (!namespaceIsArray && typeof namespace !== "string") return "";
		if (namespaceIsArray)
			namespace = (<Array<string | number>>namespace).join(
				this.#namespaceSeparator
			);
		return namespace + key;
	}
}

export default AppCache.getInstance();
