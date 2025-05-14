import type { remoteCallResponse } from "../../digitalniweb-types/custom/helpers/remoteProcedureCall.js";
import { consoleLogDev } from "../helpers/logger.js";

/**
 * First `non null/false/empty` promise result.
 *
 * If response data have (http) `status` parameter then only `<=400` are considered `non null/false/empty`.
 *
 * @param promises Promise<remoteCallResponse>[]
 * @param allow400http boolean - Axios throws error on 4xx (and 5xx) http statuses. If this is true then resolve this instead of reject.
 * @returns
 */
export default function firstNonNullRemoteCall<T>(
	promises: Promise<remoteCallResponse<T>>[],
	allow400http: boolean = true
): Promise<remoteCallResponse<T>> {
	return new Promise((resolve, reject) => {
		let count = 0;
		let nonNullSuccess = false; // non null/false/empty
		let errorCount = 0;
		let notOkStatus = 400;
		if (allow400http) notOkStatus = 500;
		promises.forEach((promise) => {
			promise
				.then((data) => {
					if (data && !nonNullSuccess) {
						if (data.status >= notOkStatus) return;

						nonNullSuccess = true;
						resolve(promiseSuccess(data));
					}
				})
				.catch((e) => {
					if (e?.response?.status < notOkStatus) {
						nonNullSuccess = true;
						resolve(promiseSuccess(e.response));
						return;
					}
					errorCount++;
					rejectedPromise(e);
				})
				.finally(() => {
					count++;
					if (count === promises.length) {
						let end = allPromisesEnded<T>(
							nonNullSuccess,
							errorCount
						);
						if (end.error) reject(end.message);
						else resolve(promiseSuccess<T>(end.data));
					}
				});
		});
	});
}

function rejectedPromise(error: any) {
	consoleLogDev(
		error,
		"warning",
		"Error happened while waiting for promises in 'firstNonNullRemoteCall'"
	);
	throw error;
}
function allPromisesEnded<T>(
	nonNullSuccess: boolean,
	errorHappened: number
):
	| { error: true; message: string }
	| { error: false; data: remoteCallResponse<T> }
	| { error: false; data: { data: null; status: number } } {
	if (!nonNullSuccess && errorHappened) {
		throw Error(
			`Nothing was found when waiting for promises in 'firstNonNullRemoteCall' but error happened in ${errorHappened} promise${
				errorHappened > 1 ? "s" : ""
			}! More info about ${
				errorHappened > 1 ? "the error" : "these errors"
			} should be logged earlier via 'rejectedPromise'.`
		);
	}
	return { error: false, data: { data: null, status: 200 } };
}
function promiseSuccess<T>(data: remoteCallResponse<T>) {
	return data;
}
