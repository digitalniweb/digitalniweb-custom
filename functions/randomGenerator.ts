import crypto from "crypto";
/**
 *
 * @param length 1-1024
 * @param specialCharacters false = only [a-zA-Z0-9_]
 * @returns random string of `length` or empty string
 */
export function randomString(
	length: number = 64,
	specialCharacters: boolean = true
): string {
	if (length < 1 || length > 1024) return "";
	let randomString = crypto.randomBytes(length).toString("base64");
	if (specialCharacters === false)
		randomString = randomString.replace(/[^\w]/g, "");
	randomString = randomString.slice(0, length).padEnd(length, "0");
	return randomString;
}

/**
 *	Max safe integer in javascript is 9007199254740991, therefore maximum safe `length` is only 15.
 *
 *  @param length length of output integer. 1-15
 *	@returns integer of `length` or 0
 */
export function randomNumberOfLength(length: number = 10): number {
	if (length > 15 || length < 1) return 0;
	let random: string | number = Math.random().toString().slice(2);
	random = random.slice(0, length).padEnd(length, "0");
	random = parseInt(random);
	return random;
}

/**
 * For generating strong password (not only) on frontend.
 *
 * Doesn't use 'node:crypto'
 */
export function generatePassword(
	minLength: number = 15,
	maxLength: number = 20,
	options: {
		includeLowercase?: boolean;
		includeUppercase?: boolean;
		includeNumbers?: boolean;
		includeSymbols?: boolean;
	} = {}
): string {
	const {
		includeLowercase = true,
		includeUppercase = true,
		includeNumbers = true,
		includeSymbols = true,
	} = options;
	const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
	const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const numberChars = "0123456789";
	const symbolChars = "!@#$%^&*()_+[]{}|;:,.<>?";

	let allChars = "";

	if (includeLowercase) allChars += lowercaseChars;
	if (includeUppercase) allChars += uppercaseChars;
	if (includeNumbers) allChars += numberChars;
	if (includeSymbols) allChars += symbolChars;

	if (allChars.length === 0) {
		allChars = lowercaseChars;
	}

	const passwordLength =
		Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

	let password = "";

	if (includeLowercase) {
		password +=
			lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
	}
	if (includeUppercase) {
		password +=
			uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
	}
	if (includeNumbers) {
		password += numberChars[Math.floor(Math.random() * numberChars.length)];
	}
	if (includeSymbols) {
		password += symbolChars[Math.floor(Math.random() * symbolChars.length)];
	}

	const remainingChars = passwordLength - password.length;

	for (let i = 0; i < remainingChars; i++) {
		password += allChars[Math.floor(Math.random() * allChars.length)];
	}

	const shuffledPassword = password
		.split("")
		.sort(() => 0.5 - Math.random())
		.join("");

	return shuffledPassword;
}
