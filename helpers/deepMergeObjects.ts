type DeepMerge<T, U> = {
	[K in keyof (T & U)]: K extends keyof U
		? K extends keyof T
			? U[K] extends object
				? T[K] extends object
					? DeepMerge<T[K], U[K]>
					: U[K]
				: U[K]
			: U[K]
		: K extends keyof T
			? T[K]
			: never;
};

export default function deepMergeObjects<
	A extends Record<string, any>,
	B extends Record<string, any>,
>(a: A, b: B): DeepMerge<A, B> {
	const result: any = { ...a };
	for (const [k, v] of Object.entries(b)) {
		if (v && typeof v === "object" && !Array.isArray(v)) {
			result[k] = deepMergeObjects(result[k] ?? {}, v);
		} else {
			result[k] = v;
		}
	}
	return result;
}
