import Language from "../../server/models/globalData/language";
import Role from "../../server/models/globalData/role";

export const globalDataListWhereMap = {
	roles: Role,
	languages: Language,
} as const;
