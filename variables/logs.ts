import { statuses } from "../../digitalniweb-types/customHelpers/statuses";

/**
 * @key `consoleLogProduction` In some cases e.g. 'Server initialization' we may want 'console.log' output in 'production' (as well). Generally shouldn't stay in production code but may be used for debugging.
 * @key `consoleLog` Same as `consoleLog` but will run only in "development" mode. Shouldn't stay in production code.
 * @key `api` For "users" API calls management when API is opened publicly/paid.
 * @key `authentication` For logging users logins; attempts to login, successful logins etc.
 * @key `moduleManipulation` When data in 'content_ms' (modules records) are changing.
 */
export const logFunctions = {
	api: "logApi",
	authorization: "logAuthorization",
	authentication: "logAuthentication",
	consoleLogProduction: "consoleLogProduction",
	consoleLog: "consoleLogDev",
	moduleManipulation: "logModuleManipulation",
} as const;

export type logTypes = keyof typeof logFunctions;
export type logFunctionNames = (typeof logFunctions)[keyof typeof logFunctions];

/**
 * https://notes.burke.libbey.me/ansi-escape-codes/
 *
 * @key `orange` I just used ChatGPT to give me the value. Prompt: "What color is orange in ANSI string for console.log in node js in 256-color palette without any libraries?"
 */
export const ANSIcolors = {
	black: 0,
	red: 1,
	green: 2,
	yellow: 3,
	blue: 4,
	magenta: 5,
	cyan: 6,
	white: 7,
	orange: "8;5;208",
};
export type ANSIcolorsKeys = keyof typeof ANSIcolors;

export const ANSIStyle = {
	bold: 1,
	italic: 3,
	underline: 4,
	reverse: 7, // flips background and foreground
	lineThrough: 9,
};

export type ANSIStyleKeys = keyof typeof ANSIStyle;

export const logColors: {
	default: "black";
} & {
	[key in statuses]?: ANSIcolorsKeys;
} & {
	[key in logTypes]?: ANSIcolorsKeys;
} = {
	default: "black",
	error: "red",
	warning: "orange",
	info: "blue",
	success: "green",
	api: "magenta",
	consoleLog: "black",
	consoleLogProduction: "black",
	moduleManipulation: "blue",
	authorization: "cyan",
	authentication: "yellow",
};
