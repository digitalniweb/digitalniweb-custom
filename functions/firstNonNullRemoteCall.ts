import { remoteCallResponse } from "../../digitalniweb-types/custom/helpers/remoteProcedureCall.js";
import { log } from "../helpers/logger.js";
import { AxiosResponse } from "axios";
import { customLogObject } from "../../digitalniweb-types/customHelpers/logger.js";

/**
 * First `non null/false/empty` promise result.
 *
 * If response data have (http) `status` parameter then only `<=400` are considered `non null/false/empty`.
 *
 * @param promises Promise<remoteCallResponse>[]
 * @returns
 */
export default function firstNonNullRemoteCall(
	promises: Promise<remoteCallResponse>[]
): Promise<remoteCallResponse> {
	return new Promise((resolve) => {
		let count = 0;
		let nonNullSuccess = false; // non null/false/empty
		let errorCount = 0;
		promises.forEach((promise) => {
			promise
				.then((data) => {
					if (data && !nonNullSuccess) {
						if (data.status >= 400) return;

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
			"Error happened while waiting for promises in 'firstNonNullRemoteCall'",
		error,
	});
}
function allPromisesEnded(
	nonNullSuccess: boolean,
	errorHappened: number
): remoteCallResponse {
	if (!nonNullSuccess && errorHappened) {
		throw {
			type: "functions",
			status: "error",
			message: `Nothing was found when waiting for promises in 'firstNonNullRemoteCall' but error happened in ${errorHappened} promise${
				errorHappened > 1 ? "s" : ""
			}! More info about ${
				errorHappened > 1 ? "the error" : "these errors"
			} should be logged earlier via 'rejectedPromise'.`,
		} as customLogObject;
	}
	return { data: null, status: 200 };
}
function promiseSuccess(data: remoteCallResponse) {
	return data;
}
