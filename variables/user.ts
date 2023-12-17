// these are ommited parameters of:
// import type { User } from "../../digitalniweb-types/models/users";
// but TypeScript currently (5.3) doesn’t support `as const` for arrays with specified types. That's why I can't infer types of User here
export const omittedLoggedUserParams = [
	"password",
	"refreshTokenSalt",
	"updatedAt",
	"deletedAt",
] as const;
