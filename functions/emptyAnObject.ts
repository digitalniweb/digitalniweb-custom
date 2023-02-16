export default function emptyAnObject(object: object) {
	if (typeof object != "object") return;
	for (let property in object)
		if (object.hasOwnProperty(property))
			delete object[property as keyof object];
}
