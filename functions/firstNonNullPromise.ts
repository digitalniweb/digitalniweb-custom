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
	console.log(error);
	return "rejectedPromise";
}
function allPromisesEnded(nonNullSuccess: boolean, errorHappened: number) {
	if (!nonNullSuccess) {
		if (errorHappened) {
			console.log(
				`Nothing was found but error happened in ${errorHappened} promise${
					errorHappened > 1 ? "s" : ""
				}!`
			);
			return false;
		}
	}
	return null;
}
function promiseSuccess(data: any) {
	return data;
}
// export default function firstNonNullPromise(
// 	promises: Promise<unknown>[],
// 	timeout: number = 5000
// ): Promise<unknown | false> {
// 	// !!! this doesn't work i guess
// 	return new Promise((resolve, reject) => {
// 		let resolvedCount = 0;
// 		promises = promises.map((promise) =>
// 			Promise.race([
// 				promise,
// 				new Promise((_, reject) =>
// 					setTimeout(
// 						() => reject(new Error("All promises timed out.")),
// 						timeout
// 					)
// 				),
// 			])
// 		);
// 		promises.forEach((promise) =>
// 			promise
// 				.then((val) => {
// 					resolvedCount++;
// 					if (val !== null) {
// 						resolve(val);
// 					} else if (resolvedCount === promises.length) {
// 						reject(false);
// 					}
// 				})
// 				.catch(reject)
// 		);
// 	});
// }

// test:
// (async function () {
// 	try {
// 		promises = [];
// 		timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// 		promises.push(
// 			timeout(10000).then(() => 10),
// 			timeout(500).then(() => 5),
// 			timeout(200).then(() => null)
// 		);
// 		await firstNonNullPromise(promises);
// 	} catch (e) {
// 		console.log(e);
// 	}
// })();
