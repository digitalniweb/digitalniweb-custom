import { pickUserLoginResponse } from "~/digitalniweb-types";

// login response parameters filter
export const userLoginResponseParams: (keyof pickUserLoginResponse)[] = [
	"uuid",
	"id",
	"nickname",
	"email",
	"roleId",
	"credit",
	"Tenant",
	"UserPrivileges",
	"websiteId",
	"websitesMsId",
] as const;

// autenticated user data in ms: res.locals.userVerified
export const userVerifiedParams = [] as const;

// ajwt
export const userJWTParams = [] as const;

// app store
export const userStoreParams = [] as const;
