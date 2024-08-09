/**
 * parentRootFallback `boolean` if true and item has no parent then append it to root, otherwise skip
 */
type buildTreeOptions = {
	children?: string;
	parentId?: string;
	id?: string;
	parentRootFallback?: boolean;
};
type TreeNode<T> = T & { children?: TreeNode<T>[] };

/**
 * If using for building Sequelize tree we need raw data, not Sequelize instance. meaning use "raw: true" or "instance.map((entity) => entity.get({ plain: true }));"
 * @param array
 * @param options
 * @returns
 */
export function buildTree<T>(
	array: T[],
	options: buildTreeOptions = {}
): TreeNode<T>[] {
	const {
		children = "children",
		parentId = "parentId",
		id = "id",
		parentRootFallback = false,
	} = options;

	// Step 1: Create a map for quick lookup of nodes by their id
	const nodeMap = new Map<number | string, T>();
	array.forEach((node) => {
		nodeMap.set(node[id as keyof T] as string | number, node);
	});
	// Step 2: Initialize the tree
	const tree: TreeNode<T>[] = [];

	// Step 3: Iterate over the array and build the tree structure
	array.forEach((node) => {
		const pid = node[parentId as keyof T];
		if (pid === null) {
			// Root node
			tree.push(node as any);
		} else {
			// Child node
			const parent = nodeMap.get(pid as string | number);
			if (typeof parent === "object" && parent !== null) {
				if (!(children in parent)) {
					(parent as any)[children] = [];
				}
				(parent as any)[children].push(node);
			} else {
				// Handle the case where the parentId could not be found
				if (parentRootFallback === false) return;
				(node as any)[`parentFallback${parentId}`] =
					node[parentId as keyof T];
				(node as any)[parentId as keyof T] = null;
				tree.push(node as any);
			}
		}
	});

	return tree;
}
