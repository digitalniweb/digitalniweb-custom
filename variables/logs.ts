export const logTypes = [
	"error",
	"warning",
	"info",
	"http",
	"debug",
	"success",
	"default",
] as const;

/**
 * https://notes.burke.libbey.me/ansi-escape-codes/
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

export type logTypesType = (typeof logTypes)[number];

export const logColors: {
	[key in logTypesType]: ANSIcolorsKeys;
} = {
	error: "red",
	warning: "orange",
	info: "blue",
	http: "magenta",
	debug: "yellow",
	success: "green",
	default: "black",
};
