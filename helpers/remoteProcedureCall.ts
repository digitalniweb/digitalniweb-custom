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

type msCallOptions = {
	name: microservices;
	req?: Request;
	protocol?: string;
	id?: number;
	path: string;
	method?: HTTPMethods;
	data?: { [key: string]: any };
	params?: { [key: string]: any };
};

type appCallOptions = Omit<msCallOptions, "id">;

export async function microserviceCall(
	options: msCallOptions
): Promise<AxiosResponse<any, any>["data"]> {
	// Primarily used for microservice calls
	const { name, id }: msCallOptions = options;
	let serviceName: microservices | undefined;
	if (!microserviceExists(name)) return false;

	if (name === process.env.MICROSERVICE_NAME) {
		console.log(
			"You don't need to call 'microserviceCall' for same microservice."
		);
		return false;
	}

	let service = await getMicroservice({
		name,
		id,
	});

	if (service === undefined) {
		console.log(
			"Microservice is undefined, wasn't found in cache or in serviceRegistry."
		);
		return false;
	}
	return makeCall(service, options);
}

export async function appCall(
	options: appCallOptions
): Promise<AxiosResponse<any, any>["data"] | false> {
	// Primarily used for microservice calls
	const { name }: msCallOptions = options;

	let service = await getApp(name);

	if (service === undefined) return false;
	return makeCall(service, options);
}

async function makeCall(
	service: ServiceRegistry | App,
	options: msCallOptions | appCallOptions
) {
	const {
		req,
		protocol = "http",
		path,
		method = "GET",
		data = {}, // POST data
		params = {}, // GET parameters (query)
	}: msCallOptions = options;
	let finalPath =
		`${protocol}://${service.host}:${service.port}` +
		(path[0] !== "/" ? "/" : "") +
		path;

	let headers = {};
	if (!isObjectEmpty(data) && method === "GET") {
		const url = new URL(finalPath);
		Object.keys(data).forEach((key) =>
			url.searchParams.append(key, data[key])
		);
		finalPath = url.toString();
	}
	if (req)
		headers = {
			"x-forwarded-for":
				req && req.headers["x-forwarded-for"]
					? (req.headers["x-forwarded-for"] as string)
					: "service",
			"user-agent":
				req && req.headers["user-agent"]
					? req.headers["user-agent"]
					: "service",
		};

	let axiosResponse = await axios({
		url: finalPath,
		method,
		data,
		params,
		headers,
	});

	// axiosResponse throws error on axios error, if data is null on remote server the null is returned as empty string
	return axiosResponse.data || null;
}
