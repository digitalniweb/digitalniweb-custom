/**
 * @param dateOrMonth number 1-12 or Date object
 * @param year
 * @returns number of days in month (if month and year or date not specified then returns number of days in current month)
 */
export const getDaysInMonth = (
	dateOrMonth?: Date | number,
	year?: number
): number => {
	let month: number;
	if (dateOrMonth === undefined) {
		dateOrMonth = new Date();
	}
	if (dateOrMonth instanceof Date) {
		month = dateOrMonth.getMonth() + 1;
		year = dateOrMonth.getFullYear();
	} else {
		month = dateOrMonth;
		if (year === undefined) {
			throw new Error("Year must be provided if month is provided");
		}
	}
	return new Date(year, month, 0).getDate();
};

type invalidDateReturn = "undefined" | "yearZero" | "yearMax";

/**
 * @returns Date. If date is invalid then return new Date("0000-01-01T00:00:00.000Z")
 */
export function addMinutesToDate(
	date: Date | string,
	minutes: number,
	invalidDateReturns: invalidDateReturn = "undefined"
): Date | undefined {
	if (typeof date === "string") date = new Date(date);
	if (!isValidDate(date)) {
		switch (invalidDateReturns) {
			case "undefined":
				return undefined;
			case "yearZero":
				return new Date("0000-01-01T00:00:00.000Z");
			case "yearMax":
				return new Date(8640000000000000);
			default:
				return undefined;
		}
	}
	return new Date(date.getTime() + minutes * 60_000);
}

/**
 * @returns Date. If date is invalid then return new Date("0000-01-01T00:00:00.000Z")
 */
export function subtractMinutesFromDate(
	date: Date,
	minutes: number,
	invalidDateReturns: invalidDateReturn = "undefined"
): Date | undefined {
	if (typeof date === "string") date = new Date(date);
	if (!isValidDate(date)) {
		switch (invalidDateReturns) {
			case "undefined":
				return undefined;
			case "yearZero":
				return new Date("0000-01-01T00:00:00.000Z");
			case "yearMax":
				return new Date(8640000000000000);
			default:
				return undefined;
		}
	}
	return new Date(date.getTime() - minutes * 60_000);
}

/**
 *
 * @param date any
 * @returns boolean - can be "Invalid date"
 */
export function isDate(date: any) {
	return date && Object.prototype.toString.call(date) === "[object Date]";
}

/**
 *
 * @param date any
 * @returns boolean - can't be "Invalid date"
 */
export function isValidDate(date: any) {
	return (
		date &&
		Object.prototype.toString.call(date) === "[object Date]" &&
		!isNaN(date)
	);
}

/**
 *
 * @param date Date object
 * @param days number of days to add
 * @returns
 */
export const addDays = (date: Date, days: number): Date => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
};

/**
 * Should work in Mysql
 * @return UTC time with timezone 0 in JS format `YYYY-MM-DDThh:mm:ss.sssZ`
 */
export const getUTCDateTime = (): string => {
	const currentUtcDate = new Date();
	const isoTimeString = currentUtcDate.toISOString();
	return isoTimeString;
};

/**
 * returns UTC time with timezone 0 in mysql format `YYYY-MM-DD hh:mm:ss`
 */
export const getUTCMysqlDateTime = (): string => {
	const isoTimeString = getUTCDateTime();
	const formattedUtcTimeString = isoTimeString.replace("T", " ").slice(0, -5);

	return formattedUtcTimeString;
};
