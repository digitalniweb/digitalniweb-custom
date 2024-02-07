import { InferAttributes, WhereOptions } from "sequelize";
import { Request } from "express";
import { log } from "./logger.js";
import { microserviceCall } from "./remoteProcedureCall.js";
import { msCallOptions } from "../../digitalniweb-types/custom/helpers/remoteProcedureCall";
import {
	globalDataModelsListMapType,
	globalDataListWhereMap,
} from "../../digitalniweb-types/custom/helpers/globalData";

import { Model, ModelStatic } from "sequelize";
import db from "../../server/models/index.js";

/**
 * This doesn't work in `globalData ms` if we wanted to get lists there! Typescript doesn't like it to mix the code together in here. Need to be done in separate file if needed.
 * @param ModelName model name of globalData
 * @param column what column of model will be used to get the list
 * @param array if not undefined nor empty then use this array to find data of Model by column
 * @returns list of all or specified data from globalData
 */
export async function getGlobalDataList<
	T extends keyof globalDataModelsListMapType,
	P extends keyof globalDataListWhereMap
>(ModelName: T, column?: P, array?: globalDataListWhereMap[P]) {
	try {
		let list;
		let where;
		if (column && array && Array.isArray(array) && array.length > 0)
			where = { [column]: array };
		let options = {
			name: "globalData",
			path: `/api/${ModelName}/list`,
		} as msCallOptions;
		if (where) options.data = { where };
		let { data } = await microserviceCall<
			InferAttributes<globalDataModelsListMapType[T]>[]
		>(options);
		list = data;
		return list;
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
		return await model?.findAll({
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
