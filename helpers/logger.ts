import { Request, Response } from "express";
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

const consoleLogDev: logFunction = (customLogObject, req): void => {
	if (process.env.NODE_ENV === "production") return;

	let logObject = customLogObject;
	if (req) {
		logObject.req = {
			method: req.method,
			originalUrl: req.originalUrl,
			path: req.path,
			query: req.query,
			params: req.params,
			body: req.body,
		};
	}
	if (logObject.code && !logObject.status)
		logObject.status = getHttpErrorLogStatus(logObject.code);

	if (process.env.APP_ID) {
		logObject.serviceType = "app";
		logObject.serviceId = process.env.APP_ID;
	} else if (process.env.MICROSERVICE_ID) {
		logObject.serviceType = "microservice";
		logObject.serviceId = process.env.MICROSERVICE_ID;
	}

	coloredLog(logObject, customLogObject.type, customLogObject.status);
};

const consoleLogProduction: logFunction = (...args): void => {
	consoleLogDev(...args);
};

const logAuthorization: logFunction = (
	customLogObject,
	req,
	res
): responseLogObject => {
	// !!! need to add all info + userId and path info and method and send it to logs_ms
	let logObject = {
		user: {
			id: res?.locals?.userVerified?.id,
			usersMsId: res?.locals?.userVerified?.msId,
		},
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
	let responseObject: responseLogObject = {
		code: args[0].code || 403,
		message: args[0].message || "Authentication failed",
	};

	if (args[0]?.data) responseObject.error = args[0]?.data;
	return responseObject;
};
const logDatabaseMessages: logFunction = (...args) => {
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
			(
				["name", "stack", "message", "code"] as (keyof commonError)[]
			).forEach((errorProp) => {
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
			});
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
	database: { logDatabaseMessages },
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
	req?: Request,
	res?: Response
): responseLogObject | void {
	const { type } = customLogObject;
	if (!type) return;
	customLogObject.date = getUTCDateTime();

	// anonymize passwords in logs before showing them or saving them into database
	if ((customLogObject?.error as any)?.config?.params?.password)
		(customLogObject.error as any).config.params.password = "ANONYMIZED";
	if (customLogObject?.req?.body?.password)
		customLogObject.req.body.password = "ANONYMIZED";
	if (req?.body?.password) req.body.password = "ANONYMIZED";

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

	try {
		console.log(style, JSON.stringify(message, null, 2));
	} catch (error: any) {
		// if JSON.stringify fails then the object has circular structure, get rid of it and try again
		console.log(style, JSON.stringify(message, getCircularReplacer(), 2));
	}
	console.log(style, "-----------------------------------------------");
};

// get rid of circular structure
const getCircularReplacer = () => {
	const seen = new WeakSet();
	return (key: unknown, value: unknown) => {
		if (typeof value === "object" && value !== null) {
			if (seen.has(value)) {
				return;
			}
			seen.add(value);
		}
		return value;
	};
};

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
