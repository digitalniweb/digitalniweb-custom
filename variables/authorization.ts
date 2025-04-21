export const mainAuthorizationNames = ["admin", "user"] as const;
export const adminAuthorizationNames = [
	"superadmin",
	"owner",
	"admin",
] as const;

export const userAuthorizationNames = ["user", "tenant"] as const;

export const authRules = {
	maxAttempts: 5,
	minPasswordLength: 10,
	timeSpanMinutes: 10,
};
