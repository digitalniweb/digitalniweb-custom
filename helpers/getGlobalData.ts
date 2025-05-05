import type {
	FindAttributeOptions,
	Includeable,
	InferAttributes,
	ModelStatic,
	Order,
	WhereAttributeHash,
	WhereOptions,
} from "sequelize";
import type { Request } from "express";
import { microserviceCall } from "./remoteProcedureCall.js";
import type { msCallOptions } from "../../digitalniweb-types/custom/helpers/remoteProcedureCall";
import type {
	globalDataModelsListMapType,
	globalDataListWhereMap,
} from "../../digitalniweb-types/custom/helpers/globalData";

import { Model } from "sequelize";
import db from "../../server/models/index.js";
import type { ParsedQs } from "qs";

/**
 * This doesn't work in `globalData ms` if we wanted to get lists there! Typescript doesn't like it to mix the code together in here. Need to be done in separate file if needed.
 * @param ModelName model name of globalData
 * @param column what column of model will be used to get the list
 * @param array if not undefined nor empty then use this array to find data of Model by column
 * @returns list of all or specified data from globalData
 */
export async function getGlobalDataList<
	T extends keyof globalDataModelsListMapType,
	P extends keyof globalDataListWhereMap | undefined = undefined
>(
	ModelName: T,
	column?: P,
	array?: P extends keyof globalDataListWhereMap
		? globalDataListWhereMap[P]
		: undefined
) {
	let list;
	let where;
	if (column && array && Array.isArray(array) && array.length > 0)
		where = { [column]: array };
	let options = {
		name: "globalData",
		path: `/api/${ModelName}/list`,
	} as msCallOptions;
	if (where) options.params = { where };

	options.cache = {
		type: "list",
		ms: "globalData",
		model: ModelName,
	};

	let { data } = await microserviceCall<
		InferAttributes<globalDataModelsListMapType[T]>[]
	>(options);
	list = data;
	return list;
}

async function getGlobalDataModelList<T extends Model>(
	model: ModelStatic<T>,
	where: WhereOptions = {},
	include: Includeable | Includeable[] | undefined = undefined,
	attributes: FindAttributeOptions | undefined = undefined,
	order: Order | undefined = undefined
) {
	let data = await db.transaction(async (transaction) => {
		return await model?.findAll({
			where,
			include,
			attributes,
			transaction,
			order,
		});
	});
	return data;
}

/**
 *
 * @param req
 * @param model
 * @param include use as usual Sequelize include
 * @returns
 */
export async function getRequestGlobalDataModelList<T extends Model>(
	req: Request,
	model: ModelStatic<T>,
	include: Includeable | Includeable[] | undefined = undefined,
	where: WhereAttributeHash | undefined = undefined,
	order: Order | undefined = undefined
) {
	const {
		code,
		name,
		id,
		where: reqWhere,
	} = req.query as globalDataListWhereMap & { where?: ParsedQs };
	if (!where) where = {};
	if (id) where.id = id;
	else if (code) where.code = code;
	else if (name) where.name = name;

	if (reqWhere) where = { ...where, ...reqWhere };
	let data = await getGlobalDataModelList(
		model,
		where,
		include,
		undefined,
		order
	);
	return data;
}

export async function getGlobalDataModelArray<
	T extends keyof globalDataModelsListMapType,
	P extends keyof globalDataListWhereMap
>(ModelName: T, column?: P, array?: globalDataListWhereMap[P], attribute?: P) {
	if (typeof attribute === "undefined") attribute = "id" as P;

	let options = {
		name: "globalData",
		path: `/api/${ModelName}/array`,
		params: { column, array, attribute },
	} as msCallOptions;
	let { data } = await microserviceCall<globalDataListWhereMap[P]>(options);
	return data;
}

/**
 *
 * @param req
 * @param model
 * @param include use as ussual Sequelize include
 * @returns
 */
export async function getRequestGlobalDataModelArray<T extends Model>(
	req: Request,
	model: ModelStatic<T>
) {
	let attribute = req.query.attribute as keyof InferAttributes<T>;
	let column = req.query.column as keyof InferAttributes<T>;
	let array = req.query.array as [];
	if (!attribute || !column || !array) return;
	let attributes = [attribute] as string[];
	let where = {
		[column]: array,
	} as WhereOptions;
	let data = await getGlobalDataModelList(
		model,
		where,
		undefined,
		attributes
	);
	const responseArray = data.map((row) => row[attribute]);
	return responseArray;
}
