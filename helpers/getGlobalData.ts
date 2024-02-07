import { InferAttributes, WhereOptions } from "sequelize";
import { Request } from "express";
import { log } from "./logger.js";
import { microserviceCall } from "./remoteProcedureCall.js";
import { msCallOptions } from "../../digitalniweb-types/custom/helpers/remoteProcedureCall";
import {
	globalDataModelsListMap,
	globalDataListWhereMap,
} from "../../digitalniweb-types/custom/helpers/globalData";

import { Model, ModelStatic } from "sequelize";
import db from "../../server/models/index.js";

/**
 * !!! I should add functionality for globalData ms - now it doesn't work on globalData ms
 * @param ModelName model name of globalData
 * @param column what column of model will be used to get the list
 * @param array if not undefined nor empty then use this array to find data of Model by column
 * @returns list of all or specified data from globalData
 */
export async function getGlobalDataList<
	T extends keyof globalDataModelsListMap,
	P extends keyof globalDataListWhereMap
>(ModelName: T, column?: P, array?: globalDataListWhereMap[P]) {
	try {
		let options = {
			name: "globalData",
			path: `/api/${ModelName}/list`,
		} as msCallOptions;
		if (column && array && Array.isArray(array) && array.length > 0)
			options.data = { [column]: array };
		let { data } = await microserviceCall<
			InferAttributes<InstanceType<globalDataModelsListMap[T]>>[]
		>(options);
		return data;
	} catch (error: any) {
		log({ type: "functions", error, status: "error" });
		return false;
	}
}
async function getGlobalDataModelList<T extends Model>(
	model: ModelStatic<T>,
	where: WhereOptions = {}
) {
	let data = await db.transaction(async (transaction) => {
		return await model.findAll({
			where,
			transaction,
		});
	});
	return data;
}
export async function getRequestGlobalDataModelList<T extends Model>(
	req: Request,
	model: ModelStatic<T>
) {
	const { code, name, id } = req.query as globalDataListWhereMap;
	let where = {} as globalDataListWhereMap;
	if (id) where = { id };
	else if (code) where = { code };
	else if (name) where = { name };
	let data = await getGlobalDataModelList(model, where);
	return data;
}
