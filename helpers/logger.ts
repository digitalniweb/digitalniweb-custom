// import Publisher from "./publisherService.js";
import { ANSIStyle, ANSIcolors, logColors } from "../variables/logs.js";
import type { ANSIStyleKeys } from "../variables/logs.js";
import type { HTTPMethods } from "../../digitalniweb-types/httpMethods.js";
import type { statuses } from "../../digitalniweb-types/customHelpers/statuses.js";
import type { resourceIdsType } from "../../digitalniweb-types/apps/communication/index.js";

export type logErrorObject = {
	statusCode: number; // http status code
	message: string;
	code?: string | number;
};
export type logObject = {
	req: {
		url: string;
		method: HTTPMethods | string;
		body?: Object;
		query?: any;
		params?: any;
	};
	error?: logErrorObject;
	caller?: {
		resourceIds?: resourceIdsType;
		ip?: string;
		ua?: string;
	};
	callee: {
		serviceType: "app" | "microservice";
		serviceId: number;
	};
	time: string | Date;
};

function getHttpErrorLogStatus(code: number) {
	let type: statuses = "success";
	if (code >= 500) type = "error";
	else if (code >= 400) type = "warning";
	else if (code >= 300) type = "info";
	return type;
}

const consoleLogDev = (
	object: Record<string, any>,
	status?: statuses,
	headline?: string
): void => {
	if (process.env.NODE_ENV === "production") return;
	if (!status)
		if (object.statusCode)
			status = getHttpErrorLogStatus(object.statusCode);
		else status = "error";

	coloredLog(object, status, headline);
};

const consoleLogProduction = (
	object: any,
	status?: statuses,
	headline?: string
): void => {
	// this needs to be changed
	if (!status)
		if (object.statusCode)
			status = getHttpErrorLogStatus(object.statusCode);
		else status = "error";

	coloredLog(object, status, headline);
};

// const logAuthorization: logFunction = (
// 	customLogObject,
// 	req,
// 	res
// ): responseLogObject => {
// 	// !!! need to add all info + userId and path info and method and send it to logs_ms
// 	// let logObject = {
// 	// 	user: {
// 	// 		id: res?.locals?.userVerified?.id,
// 	// 		usersMsId: res?.locals?.userVerified?.msId,
// 	// 	},
// 	// };
// 	let responseObject: responseLogObject = {
// 		code: 403,
// 		message: "Forbidden",
// 	};
// 	return responseObject;
// };

// const logAuthentication: logFunction = (...args) => {
// 	// !!! this needs to be changed, this is wrong
// 	consoleLogDev(...args);
// 	let responseObject: responseLogObject = {
// 		code: args[0].code || 403,
// 		message: args[0].message || "Authentication failed",
// 	};

// 	if (args[0]?.data) responseObject.error = args[0]?.data;
// 	return responseObject;
// };
// const logDatabaseMessages: logFunction = (...args) => {
// 	// !!! this needs to be changed, this is wrong
// 	consoleLogDev(...args);
// };
// const logFunctionsOutput: logFunction = (...args) => {
// 	// !!! this needs to be changed, this is wrong
// 	consoleLogDev(...args);
// };
// const logSystemInfo: logFunction = (...args) => {
// 	// !!! this needs to be changed, this is wrong
// 	consoleLogDev(...args);
// };
// const logRoutingInfo: logFunction = (...args) => {
// 	// !!! this needs to be changed, this is wrong
// 	console.log("args", args);

// 	consoleLogDev(...args);
// 	let responseObject: responseLogObject = {
// 		code: args?.[0]?.code ?? 500,
// 		message: args?.[0]?.message ?? "Something went wrong.",
// 		data: args?.[0]?.data ?? "Something went wrong.",
// 	};
// 	return responseObject;
// };

// const logApi: logFunction = (customLogObject, req): responseLogObject => {
// 	let responseObject: responseLogObject = {
// 		code: 200,
// 		message: "OK",
// 	};
// 	let logObject = {} as logObject;
// 	if (customLogObject.error) {
// 		logObject.error = {};
// 		if (typeof customLogObject.error === "string") {
// 			logObject.error.message = customLogObject.error;
// 		} else
// 			(
// 				["name", "stack", "message", "code"] as (keyof commonError)[]
// 			).forEach((errorProp) => {
// 				if ((customLogObject?.error as commonError)[errorProp]) {
// 					(logObject.error as commonError)[errorProp] = (
// 						customLogObject.error as commonError
// 					)[errorProp];
// 				}
// 			});
// 	}
// 	let message =
// 		customLogObject.message ||
// 		(typeof customLogObject?.error === "string"
// 			? customLogObject.error
// 			: customLogObject?.error?.message);
// 	if (message) {
// 		responseObject.message = message;
// 		logObject.message = message;
// 	}
// 	logObject.type = customLogObject.type ?? "default";

// 	let code =
// 		customLogObject.code ||
// 		(typeof customLogObject?.error !== "string" &&
// 			customLogObject?.error?.code);
// 	if (code) {
// 		logObject.code = code;
// 		responseObject.code = code;
// 	}

// 	let status = customLogObject.status;

// 	if (status) logObject.status = status;
// 	else if (code) logObject.status = getHttpErrorLogStatus(code);

// 	if (req) {
// 		logObject.req = {
// 			ip: req.ip,
// 			originalUrl: req.originalUrl,
// 			method: req.method as HTTPMethods,
// 		};
// 	}
// 	logObject.date = getUTCDateTime();
// 	if (process.env.NODE_ENV === "development") {
// 		coloredLog(logObject, logObject.type, logObject.status);
// 	} else {
// 		// !! Here or somewhere else before logging I can create cache which will last till the end of the day where I can save data about number of requests (or requests left), blocked status etc. This can be processed then. This can be used for paid API calls

// 		Publisher.publish(
// 			`logData-${logFunctions[customLogObject.type]}`,
// 			JSON.stringify(logObject)
// 		);
// 	}

// 	return responseObject;
// };

const coloredLog = function (
	message: any,
	status?: statuses,
	headline?: string
) {
	if (!message) return;
	let style = customConsoleLogANSI({});

	if (status) {
		style = customConsoleLogANSI({ text: logColors[status] });
		console.log(style, "-----------------------------------------------");
		console.log(
			customConsoleLogANSI({
				background: logColors[status],
			}),
			status
		);
	} else {
		console.log(style, "-----------------------------------------------");
		console.log(style, "Custom logout:");
	}

	try {
		console.log(
			style,
			(headline ?? "") + "\n" + JSON.stringify(message, null, 2)
		);
	} catch (error: any) {
		// if JSON.stringify fails then the object has circular structure, get rid of it and try again
		console.log(
			style,
			(headline ?? "") +
				"\n" +
				JSON.stringify(message, getCircularReplacer(), 2)
		);
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

const logErrorRoute = function (logObject: logObject) {
	coloredLog(logObject, "error");
};

export { logErrorRoute, coloredLog, consoleLogDev, consoleLogProduction };
