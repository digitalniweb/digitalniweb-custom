import NodeCache from "node-cache";

type namespace =
	| string
	| Array<string | number | null | undefined | false>
	| undefined;
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
		if (Array.isArray(namespace)) {
			namespace = namespace.filter(Boolean);
			namespace = namespace.join(this.#namespaceSeparator);
		} else if (typeof namespace !== "string") return "";
		return namespace + key;
	}
}

export default AppCache.getInstance();
