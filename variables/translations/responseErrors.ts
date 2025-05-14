import type { translations } from "~/digitalniweb-types/translations";

export const responseErrorsTranslations: translations = {
	LoginErrorWrongLogin: {
		en: "Logging in was unsuccessful",
		cs: "Přihlášení se nezdařilo",
	},
	LoginErrorTooManyAttempts: {
		en: "There were too many attempts to log in.",
		cs: "Bylo zaznamenáno příliš mnoho pokusů o přihlášení",
	},
	errorUniqueEmail: {
		en: "Email is already taken",
		cs: "Email je již obsazen",
	},
	errorUniqueNickname: {
		en: "Nickname is already taken",
		cs: "Jméno je již obsazeno",
	},
};
