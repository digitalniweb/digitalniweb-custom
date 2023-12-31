import { Role } from "../../digitalniweb-types/models/globalData";
import { log } from "./logger";
import { microserviceCall } from "./remoteProcedureCall";

export async function getGlobalRoles() {
	try {
		let { data: roles }: { data: Role[] } = await microserviceCall({
			name: "globalData",
			path: "/api/roles/list",
		});
		return roles;
	} catch (error: any) {
		log({ type: "functions", error });
		return false;
	}
}
