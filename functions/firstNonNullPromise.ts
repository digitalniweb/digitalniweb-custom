import { log } from "../helpers/logger.js";

/**
 * first non null/false/empty promise result
 * @param promises
 * @returns
 */
export default function firstNonNullPromise(
	promises: Promise<unknown>[]
): Promise<unknown | false> {
	return new Promise((resolve) => {
		let count = 0;
		let nonNullSuccess = false; // non null/false/empty
		let errorCount = 0;
		promises.forEach((promise) => {
			promise
				.then((data) => {
					if (data) {
						nonNullSuccess = true;
						resolve(promiseSuccess(data));
					}
				})
				.catch((e) => {
					errorCount++;
					rejectedPromise(e);
				})
				.finally(() => {
					count++;
					if (count === promises.length) {
						resolve(allPromisesEnded(nonNullSuccess, errorCount));
					}
				});
		});
	});
}

function rejectedPromise(error: any) {
	log({
		type: "functions",
		status: "warning",
		message:
			"Error happened while waiting for promises in 'firstNonNullPromise'",
		error,
	});
	return "rejectedPromise";
}
function allPromisesEnded(nonNullSuccess: boolean, errorHappened: number) {
	if (!nonNullSuccess) {
		if (errorHappened) {
			log({
				type: "functions",
				status: "error",
				message: `Nothing was found when waiting for promises in 'firstNonNullPromise' but error happened in ${errorHappened} promise${
					errorHappened > 1 ? "s" : ""
				}! More info about ${
					errorHappened > 1 ? "the error" : "these errors"
				} should be logged earlier via 'rejectedPromise'.`,
			});
			return false;
		}
	}
	return null;
}
function promiseSuccess(data: any) {
	return data;
}
