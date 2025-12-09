/**
 * removes default values from object, others stay, even those not specified in `defaults`
 */
export default function removeDefaults<T>(obj: T, defaults: T): T {
	const result: any = Array.isArray(obj) ? [] : {};

	for (const key in obj) {
		const value = obj[key];
		const def = defaults?.[key];

		// If value is object → compare recursively
		if (value && typeof value === "object" && !Array.isArray(value)) {
			const nested = removeDefaults(value, (def as any) || {});
			if (Object.keys(nested).length > 0) {
				result[key] = nested;
			}
		}

		// If arrays → keep only if not equal to default
		else if (Array.isArray(value)) {
			if (
				!Array.isArray(def) ||
				JSON.stringify(value) !== JSON.stringify(def)
			) {
				result[key] = value;
			}
		}

		// Primitive values → keep only if different
		else {
			if (value !== def) {
				result[key] = value;
			}
		}
	}

	return result as T;
}
