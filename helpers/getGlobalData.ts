import { InferAttributes } from "sequelize";
import { Role } from "../../digitalniweb-types/models/globalData";
import { log } from "./logger";
import { microserviceCall } from "./remoteProcedureCall";

export async function getGlobalRoles() {
	try {
		let { data: roles } = await microserviceCall<InferAttributes<Role>[]>({
			name: "globalData",
			path: "/api/roles/list",
		});
		return roles;
	} catch (error: any) {
		log({ type: "functions", error, status: "error" });
		return false;
	}
}
