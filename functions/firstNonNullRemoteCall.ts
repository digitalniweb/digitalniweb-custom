import type { remoteCallResponse } from "../../digitalniweb-types/custom/helpers/remoteProcedureCall.js";
import { consoleLogDev } from "../helpers/logger.js";
import type { errorResponse } from "../../digitalniweb-types/errors.js";

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
		let errors: errorResponse[] = [];
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
					errors.push(e);
					rejectedPromise(e);
				})
				.finally(() => {
					count++;
					if (count === promises.length) {
						let end = allPromisesEnded<T>(nonNullSuccess, errors);
						if (end.error) reject(end);
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
	if (error?.response?.data) error.data = error.response.data;
	return error;
}
function allPromisesEnded<T>(
	nonNullSuccess: boolean,
	errors: errorResponse[]
):
	| { error: true; message: string; data?: Record<string, any> }
	| { error: false; data: remoteCallResponse<T> }
	| { error: false; data: { data: null; status: number } } {
	if (!nonNullSuccess && errors.length > 0) {
		let errorToSend = {} as errorResponse;
		for (let i = 0; i < errors.length; i++) {
			let error = errors[i];

			if (
				error?.data ||
				(error.statusCode !== 404 && error.statusCode !== 500)
			) {
				errorToSend = error;
				break;
			}
		}

		return {
			error: true,
			message:
				errorToSend.message ??
				`Nothing was found when waiting for promises in 'firstNonNullRemoteCall' but error happened in ${
					errors.length
				} promise${errors.length > 1 ? "s" : ""}! More info about ${
					errors.length > 1 ? "the error" : "these errors"
				} should be logged earlier via 'rejectedPromise'.`,
			data: errorToSend?.data,
		};
	}
	return { error: false, data: { data: null, status: 200 } };
}
function promiseSuccess<T>(data: remoteCallResponse<T>) {
	return data;
}
