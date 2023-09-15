import { Request } from "express";
import Publisher from "./publisherService.js";
import {
	commonError,
	customLogObject,
	logObject,
	responseLogObject,
} from "../../digitalniweb-types/customHelpers/logger.js";

import {
	ANSIStyle,
	ANSIStyleKeys,
	ANSIcolors,
	logColors,
	logTypes,
	logFunctions,
} from "../variables/logs.js";
import HTTPMethods from "../../digitalniweb-types/httpMethods.js";
import { statuses } from "../../digitalniweb-types/customHelpers/statuses.js";
import { getUTCDateTime } from "../functions/dateFunctions.js";

function getHttpErrorLogStatus(code: number) {
	let type: statuses = "success";
	if (code >= 500) type = "error";
	else if (code >= 400) type = "warning";
	else if (code >= 300) type = "info";
	return type;
}

const consoleLogProduction: logFunction = (...args): void => {
	consoleLogDev(...args);
};
const consoleLogDev: logFunction = (customLogObject, req): void => {
	if (process.env.NODE_ENV === "production") return;
	let logObject = customLogObject;
	if (req)
		logObject.req = {
			method: req.method,
			path: req.path,
		};
	if (logObject.code && !logObject.status)
		logObject.status = getHttpErrorLogStatus(logObject.code);

	coloredLog(logObject, customLogObject.type, customLogObject.status);
};

const logAuthorization: logFunction = (
	customLogObject,
	req
): responseLogObject => {
	// !!! need to add all info + userId and path info and method and send it to logs_ms
	let logObject = {
		user: { id: req?.userVerified?.id, usersMsId: req?.userVerified?.msId },
	};
	let responseObject: responseLogObject = {
		code: 403,
		message: "Forbidden",
	};
	return responseObject;
};

const logAuthentication: logFunction = (...args) => {
	// !!! this needs to be changed, this is wrong
	consoleLogDev(...args);
};
const logFunctionsOutput: logFunction = (...args) => {
	// !!! this needs to be changed, this is wrong
	consoleLogDev(...args);
};
const logSystemInfo: logFunction = (...args) => {
	// !!! this needs to be changed, this is wrong
	consoleLogDev(...args);
};
const logRoutingInfo: logFunction = (...args) => {
	// !!! this needs to be changed, this is wrong
	consoleLogDev(...args);
	let responseObject: responseLogObject = {
		code: 500,
		message: "Something went wrong.",
	};
	return responseObject;
};

const logApi: logFunction = (customLogObject, req): responseLogObject => {
	let responseObject: responseLogObject = {
		code: 200,
		message: "OK",
	};
	let logObject = {} as logObject;
	if (customLogObject?.error) {
		logObject.error = {} as commonError;
		if (typeof customLogObject.error === "string") {
			logObject.error.message = customLogObject.error;
		} else
			(["name", "stack", "message", "code"] as const).forEach(
				(errorProp) => {
					if ((customLogObject?.error as commonError)[errorProp]) {
						if (errorProp === "code") {
							(logObject.error as commonError)[errorProp] = (
								customLogObject.error as commonError
							)[errorProp];
						} else {
							(logObject.error as commonError)[errorProp] = (
								customLogObject.error as commonError
							)[errorProp];
						}
					}
				}
			);
	}
	let message =
		customLogObject.message ||
		(typeof customLogObject?.error === "string"
			? customLogObject.error
			: customLogObject?.error?.message);
	if (message) {
		responseObject.message = message;
		logObject.message = message;
	}
	logObject.type = customLogObject.type ?? "default";

	let code =
		customLogObject.code ||
		(typeof customLogObject?.error !== "string" &&
			customLogObject?.error?.code);
	if (code) {
		logObject.code = code;
		responseObject.code = code;
	}

	let status = customLogObject.status;

	if (status) logObject.status = status;
	else if (code) logObject.status = getHttpErrorLogStatus(code);

	if (req) {
		logObject.req = {
			ip: req.ip,
			originalUrl: req.originalUrl,
			method: req.method as HTTPMethods,
		};
	}
	logObject.date = getUTCDateTime();
	if (process.env.NODE_ENV === "development") {
		coloredLog(logObject, logObject.type, logObject.status);
	} else {
		// !! Here or somewhere else before logging I can create cache which will last till the end of the day where I can save data about number of requests (or requests left), blocked status etc. This can be processed then. This can be used for paid API calls

		Publisher.publish(
			`logData-${logFunctions[customLogObject.type]}`,
			JSON.stringify(logObject)
		);
	}

	return responseObject;
};

/**
 * Unfortunately I can't do 1 level object like so {"api": "logApi"} with typescript, I can't type named functions. For typescript to work properly I need to do this nesting.
 */
const logFunctionsMap: {
	[key in logTypes]?: {
		[innerKey in (typeof logFunctions)[key]]: logFunction;
	};
} = {
	api: { logApi },
	authorization: { logAuthorization },
	authentication: { logAuthentication },
	consoleLog: { consoleLogDev },
	consoleLogProduction: { consoleLogProduction },
	functions: { logFunctionsOutput },
	routing: { logRoutingInfo },
	system: { logSystemInfo },
};

type logFunction = typeof log;
/**
 * In "dev" mode console.logs out log/error data
 *
 * In "production" mode sends `logObject` to logs_ms via redis message
 *
 * !!! need to add user, website and app/ms data
 *
 * !!! should change/split to multiple logs - api calls, errors, changes made, authentications - type/status
 *
 * @param customLogObject
 * @param req
 * @returns object httpResponse {message, code} to send as http response if needed
 */
const log = function (
	customLogObject: customLogObject,
	req?: Request
): responseLogObject | void {
	const { type } = customLogObject;
	if (!type) return;
	customLogObject.date = getUTCDateTime();

	// !!! I should add here App/Microservice Type and microservice/app ID
	// !!! from cache which should I create (if is not yet)
	customLogObject.serviceType;
	customLogObject.serviceId;

	let logValue = (
		logFunctionsMap[type] as {
			[key in (typeof logFunctions)[logTypes]]: logFunction;
		}
	)?.[logFunctions[type]]?.(customLogObject, req);
	return logValue;
};

const coloredLog = function (message: any, type?: logTypes, status?: statuses) {
	if (!message) return;
	let style = customConsoleLogANSI({});

	if (type) {
		style = customConsoleLogANSI({ text: logColors[status ?? "default"] });
		console.log(style, "-----------------------------------------------");
		console.log(
			customConsoleLogANSI({
				background: logColors[type ?? "default"],
			}),
			type
		);
	} else {
		console.log(style, "-----------------------------------------------");
		console.log(style, "Custom logout:");
	}

	// console.log(style, JSON.stringify(message, getCircularReplacer(), 2)); instead of next line if needed all req properties + uncomment getCircularReplacer
	console.log(style, JSON.stringify(message, null, 2));
	console.log(style, "-----------------------------------------------");
};

// get rid of circular structure
// const getCircularReplacer = () => {
// 	const seen = new WeakSet();
// 	return (key: unknown, value: unknown) => {
// 		if (typeof value === "object" && value !== null) {
// 			if (seen.has(value)) {
// 				return;
// 			}
// 			seen.add(value);
// 		}
// 		return value;
// 	};
// };

type customConsoleLog = {
	text?: keyof typeof ANSIcolors;
	background?: keyof typeof ANSIcolors;
	styles?: ANSIStyleKeys | ANSIStyleKeys[];
};

const customConsoleLogANSI = function (options: customConsoleLog) {
	let { text, background, styles } = options;

	let logStyle = "";
	let endStyle = "%s\x1b[0m";
	if (
		text === undefined &&
		background === undefined &&
		(styles === undefined || styles.length === 0)
	)
		return endStyle;
	if (text) logStyle += `\x1b[3${ANSIcolors[text]}m`;
	if (background) logStyle += `\x1b[4${ANSIcolors[background]}m`;
	if (styles) {
		if (typeof styles === "string") styles = [styles];
		styles.forEach((style) => {
			logStyle += createANSIStyle(style);
		});
	}
	logStyle += endStyle;
	return logStyle;
};
function createANSIStyle(style: ANSIStyleKeys) {
	return `\x1b[${ANSIStyle[style]}m`;
}

export { log };
