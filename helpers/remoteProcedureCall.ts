import axios, { AxiosResponse } from "axios";

import { Request } from "express";
import { HTTPMethods } from "../../digitalniweb-types/httpMethods.js";
import { microservicesArray } from "../variables/microservices.js";
import { microservices } from "../../digitalniweb-types/index.js";
import appCache from "./appCache.js";
import {
	getApp,
	getMicroservice,
	requestServiceRegistryInfo,
	microserviceExists,
} from "./serviceRegistryCache.js";
import {
	ServiceRegistry,
	App,
} from "../../digitalniweb-types/models/globalData.js";
import isObjectEmpty from "../functions/isObjectEmpty.js";
import { log } from "./logger.js";

type msCallOptions = {
	name: microservices;
	req?: Request;
	protocol?: string;
	id?: number;
	path: string;
	method?: HTTPMethods;
	data?: { [key: string]: any };
	params?: { [key: string]: any };
	headers?: HeadersInit;
};

type appCallOptions = Omit<msCallOptions, "name"> & { name: string };

export async function microserviceCall(
	options: msCallOptions
): Promise<AxiosResponse<any, any>["data"]> {
	const { name, id }: msCallOptions = options;
	if (!microserviceExists(name)) return false;

	if (name === process.env.MICROSERVICE_NAME) {
		log({
			type: "consoleLog",
			message:
				"You don't need to call 'microserviceCall' for same microservice.",
			status: "info",
		});
		return false;
	}

	let service = await getMicroservice({
		name,
		id,
	});

	if (!service) {
		log({
			type: "system",
			message:
				"Microservice is undefined, wasn't found in cache or in serviceRegistry.",
			status: "warning",
		});
		return false;
	}
	return makeCall(service, options);
}

export async function appCall(
	options: appCallOptions
): Promise<AxiosResponse<any, any>["data"] | false> {
	const { name } = options;

	let service = await getApp(name);

	if (!service) return false;
	return makeCall(service, options);
}

async function makeCall(
	service: ServiceRegistry | App,
	options: msCallOptions | appCallOptions
) {
	const {
		req,
		protocol = "https",
		path,
		method = "GET",
		data = {}, // POST data
		params = {}, // GET parameters (query)
		headers,
	}: msCallOptions | appCallOptions = options;
	let finalHost =
		service.host === process.env.HOST ? "localhost" : service.host;
	if (process.env.NODE_ENV === "development") finalHost = "localhost";
	let finalProtocol =
		finalHost === "localhost" && protocol === "https" ? "http" : protocol;
	if (process.env.NODE_ENV === "development") finalProtocol = "http";
	let finalPath =
		`${finalProtocol}://${finalHost}:${service.port}` +
		(path[0] !== "/" ? "/" : "") +
		path;

	let newHeaders = new Headers(headers);
	if (!isObjectEmpty(data) && method === "GET") {
		const url = new URL(finalPath);
		Object.keys(data).forEach((key) =>
			url.searchParams.append(key, data[key])
		);
		finalPath = url.toString();
	}

	if (req) {
		if (req.headers["x-forwarded-for"])
			newHeaders.set(
				"x-forwarded-for",
				req.headers["x-forwarded-for"] as string
			);
		else newHeaders.set("x-forwarded-for", "service");
		if (req.headers["user-agent"])
			newHeaders.set("user-agent", req.headers["user-agent"]);
		else newHeaders.set("user-agent", "service");
	}

	let axiosResponse = await axios({
		url: finalPath,
		method,
		data,
		params,
		headers: Object.fromEntries(newHeaders.entries()),
	});

	// axiosResponse throws error on axios error, if data is null on remote server the null is returned as empty string
	return axiosResponse.data || null;
}
