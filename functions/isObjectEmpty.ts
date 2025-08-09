export default function isObjectEmpty(obj: Object | undefined) {
	return obj?.constructor === Object && Object.keys(obj).length === 0;
}
