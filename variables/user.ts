import type {
	pickUserLoginResponse,
	userJWT,
	userRefreshToken,
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
	"role",
	"credit",
	"Tenant",
	"UserPrivileges",
	"UserModulesIds",
	"websiteId",
	"websitesMsId",
	"websiteUuid",
] as const;

// autenticated user data in ms: res.locals.userVerified
export const userVerifiedParams: (keyof userVerified)[] = [
	"UserPrivileges",
	"UserModulesIds",
	"credit",
	"id",
	"role",
	"usersMsId",
	"uuid",
	"websiteId",
	"websitesMsId",
	"websiteUuid",
] as const;

// jwt / access_token
export const userJWTParams: (keyof userJWT)[] = [
	"UserPrivileges",
	"UserModulesIds",
	"credit",
	"email",
	"id",
	"nickname",
	"role",
	"usersMsId",
	"uuid",
	"websiteId",
	"websitesMsId",
	"websiteUuid",
] as const;

// refresh_token
export const userRefreshTokenParams: (keyof userRefreshToken)[] = [
	"id",
	"usersMsId",
	"uuid",
] as const;

// app store
export const userStoreParams: (keyof userStore)[] = [
	"Tenant",
	"UserPrivileges",
	"UserModulesIds",
	"credit",
	"email",
	"id",
	"nickname",
	"role",
	"usersMsId",
	"uuid",
	"websiteId",
	"websitesMsId",
	"websiteUuid",
] as const;
