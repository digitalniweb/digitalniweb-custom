import { Request } from "express";

import {
	customLogObject,
	logTypes,
} from "../../digitalniweb-types/customHelpers/logger.js";

import {
	ANSIStyle,
	ANSIStyleKeys,
	ANSIcolors,
	logColors,
	logTypesType,
} from "../variables/logs.js";
import HTTPMethods from "../../digitalniweb-types/httpMethods.js";

/**
 * Properties are assigned from `customLogObject`.
 *
 * Top level properties of `customLogObject` have priority over its nested properties (`message` > `error.message`)
 * @property {number|undefined} code
 * @property {string} message
 */
type responseLogObject = {
	code: number;
	message: string;
};

/**
 * object / data to log (both in "dev" and "production")
 */
type logObject = {
	error?: {
		message?: string;
		name?: string;
		stack?: string;
		code?: number;
	};
	req?: {
		ip?: string;
		method?: HTTPMethods;
		originalUrl?: string;
	};
	message?: string;
	code?: number;
	type: logTypes;
};

function getHttpErrorLogType(code: number) {
	let type: logTypes = "success";
	if (code >= 500) type = "error";
	else if (code >= 400) type = "warning";
	else if (code >= 300) type = "info";
	return type;
}

/**
 * In "dev" mode console.logs out log/error data
 *
 * In "production" mode sends `logObject` to logs_ms via redis message
 *
 * Returns
 *
 * @param customLogObject
 * @param req
 * @returns object httpResponse {message, code} to send as http response if needed
 */
const customBELogger = function (
	customLogObject: customLogObject,
	req: Request | false = false
): responseLogObject {
	let responseObject: responseLogObject = {
		code: 200,
		message: "OK",
	};
	let logObject = {
		message: customLogObject.message || customLogObject?.error?.message,
	} as logObject;
	if (customLogObject.error) {
		if (typeof customLogObject.error === "string") {
			logObject.error = {};
			logObject.error.message = customLogObject.error;
		} else
			(["name", "stack", "message", "code"] as const).forEach(
				(errorProp) => {
					if (customLogObject?.error[errorProp]) {
						if (!logObject.error) logObject.error = {};
						logObject.error[errorProp] =
							customLogObject.error[errorProp];
					}
				}
			);
	}
	if (req) logObject.type = "http";

	let message = customLogObject.message || customLogObject.error?.message;
	if (message) {
		responseObject.message = message;
	}
	logObject.type = customLogObject.type ?? "default";

	let code = customLogObject.code || customLogObject?.error?.code;
	let messageType = logObject.type;
	if (code) {
		logObject.type = "http";
		messageType = getHttpErrorLogType(code);
		logObject.code = code;
		responseObject.code = code;
	}
	if (req) {
		logObject.req = {
			ip: req.ip,
			originalUrl: req.originalUrl,
			method: req.method as HTTPMethods,
		};
	}
	if (process.env.NODE_ENV === "development") {
		coloredLog(logObject, logObject.type, messageType);
	} else {
	}

	return responseObject;
};

const coloredLog = function (
	message: any,
	type: logTypesType | undefined,
	messageType: logTypesType | undefined = undefined
) {
	if (!message) return;
	let style = customConsoleLogANSI({});

	if (type && type !== "default") {
		style = customConsoleLogANSI({ text: logColors[messageType ?? type] });
		console.log(style, "-----------------------------------------------");
		console.log(
			customConsoleLogANSI({
				background: logColors[type],
			}),
			type
		);
	} else {
		console.log(style, "-----------------------------------------------");
		console.log(style, "Custom logout:");
	}

	console.log(style, JSON.stringify(message, null, 2));
	console.log(style, "-----------------------------------------------");
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

export { customBELogger };
