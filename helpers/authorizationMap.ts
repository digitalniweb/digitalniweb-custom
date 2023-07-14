import appCache from "./appCache.js";
import { microserviceCall } from "./remoteProcedureCall.js";

import { Request } from "express";
import {
	authorizationListType,
	authorizationMap,
} from "../../digitalniweb-types/authorization/index.js";
import {
	Role as RoleType,
	Privilege as PrivilegeType,
} from "../../digitalniweb-types/models/globalData.js";

async function getAuthorizationMap(req: Request) {
	// appCache.del("map", "authorizationMap");
	let authorizationMap = {} as authorizationMap;
	if (!appCache.has("map", "authorizationMap")) {
		let authorizationList: authorizationListType = await microserviceCall({
			req,
			name: "globalData",
			path: "/api/rolesprivileges/list?select=all&type=all",
			method: "GET",
		});
		if (authorizationList) {
			let property: keyof authorizationListType;
			for (property in authorizationList) {
				let currentAuthorizationType = authorizationList[property];
				if (currentAuthorizationType)
					currentAuthorizationType.forEach(
						(object: RoleType | PrivilegeType) => {
							if (
								!authorizationMap[property] ||
								!authorizationMap[property]![object.type]
							)
								// @ts-ignore: This works but in Nuxt it complains
								authorizationMap[property][object.type] = {};
							// @ts-ignore: This works but in Nuxt it complains
							authorizationMap[property][object.type][
								object.name
							] = object.id;
						}
					);
			}
		}
		if (authorizationMap)
			appCache.set(
				"map",
				JSON.stringify(authorizationMap),
				"authorizationMap"
			);
	} else {
		let authorizationMapString = appCache.get("map", "authorizationMap");
		if (authorizationMapString)
			authorizationMap = JSON.parse(authorizationMapString);
	}

	return authorizationMap;
}

export default {
	getAuthorizationMap,
};
