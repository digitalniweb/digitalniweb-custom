/**
 * @returns `object` T
 */
export default function getObjectFromArray<T>(
	wantedValue: any = 1,
	searchedTreeArray: T[] = [],
	treeLevel: number = -1,
	options = {
		key: "id",
		children: "children",
	}
): T | false {
	for (let i = 0; i < searchedTreeArray.length; i++) {
		let obj = searchedTreeArray[i] as any;
		if (!obj[options.key]) continue;
		if (obj?.[options.key] == wantedValue) {
			return searchedTreeArray[i];
		}
		if (!obj[options.children]) continue;
		if (
			treeLevel != -1
				? obj[options.children] && obj.treeLevel <= treeLevel
				: obj[options.children]
		) {
			const wantedObject = getObjectFromArray<T>(
				wantedValue,
				obj[options.children],
				treeLevel
			);
			if (wantedObject !== false) return wantedObject;
		}
	}
	return false;
}
