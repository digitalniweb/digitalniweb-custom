import {
	pickUserLoginResponse,
	userJWT,
	userStore,
	userVerified,
} from "../../digitalniweb-types/users";

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
export const userVerifiedParams: (keyof userVerified)[] = [
	"UserPrivileges",
	"credit",
	"id",
	"role",
	"usersMsId",
	"uuid",
	"websiteId",
	"websitesMsId",
] as const;

// ajwt
export const userJWTParams: (keyof userJWT)[] = [
	"UserPrivileges",
	"credit",
	"email",
	"id",
	"nickname",
	"role",
	"usersMsId",
	"uuid",
	"websiteId",
	"websitesMsId",
] as const;

// app store
export const userStoreParams: (keyof userStore)[] = [
	"Tenant",
	"UserPrivileges",
	"credit",
	"email",
	"id",
	"nickname",
	"role",
	"usersMsId",
	"uuid",
	"websiteId",
	"websitesMsId",
] as const;
