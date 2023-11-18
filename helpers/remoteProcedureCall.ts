import axios, { AxiosResponse } from "axios";

import { Request } from "express";
import { HTTPMethods } from "../../digitalniweb-types/httpMethods.js";
import { microservices } from "../../digitalniweb-types/index.js";
import {
	getAllServiceRegistryServices,
	getApp,
	getMicroservice,
	microserviceExists,
} from "./serviceRegistryCache.js";
import {
	ServiceRegistry,
	App,
} from "../../digitalniweb-types/models/globalData.js";
import isObjectEmpty from "../functions/isObjectEmpty.js";
import { log } from "./logger.js";
import isArray from "../functions/isArray.js";
import firstNonNullPromise from "../functions/firstNonNullPromise.js";

/**
 * @property { [key: string]: any } `data` POST data
 * @property { [key: string]: any } `params` GET parameters (query)
 * @property  'single' | 'all' `scope` 'single' calls single service (main if `id` is not supplied). 'all' creates calls to all services and waits for first non-null result.
 */
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
	scope?: "single" | "all";
	timeout?: number;
};

type appCallOptions = Omit<msCallOptions, "name"> & { name: string };

export async function microserviceCall(
	options: msCallOptions
): Promise<AxiosResponse<any, any>["data"]> {
	const { name, id, scope = "single" }: msCallOptions = options;
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

	let headers = createCallHeaders(options);
	let finalPath;
	if (scope === "single") {
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
		finalPath = createCallPath(service, options);
		return makeCall({
			url: finalPath,
			headers,
			data: options.data,
			method: options.method,
			params: options.params,
			timeout: options.timeout,
		});
	} else if (scope === "all") {
		let services = await getAllServiceRegistryServices(name);
		if (!services) {
			log({
				type: "system",
				message:
					"Microservices are undefined, weren't found in cache or in serviceRegistry.",
				status: "warning",
			});
			return false;
		}
		let requestsToServices: Promise<unknown>[] = [];
		services.forEach((service) => {
			finalPath = createCallPath(service, options);
			requestsToServices.push(
				makeCall({
					url: finalPath,
					headers,
					data: options.data,
					method: options.method,
					params: options.params,
					timeout: options.timeout,
				})
			);
		});
		return await firstNonNullPromise(requestsToServices);
	}
}

function addRegisterApiKeyAuthHeader() {
	return {
		Authorization: `Bearer ${process.env.GLOBALDATA_REGISTRY_API_KEY}`,
	};
}

export async function appCall(
	options: appCallOptions
): Promise<AxiosResponse<any, any>["data"] | false> {
	const { name } = options;

	let service = await getApp(name);

	if (!service) return false;
	let finalPath = createCallPath(service, options);
	let headers = createCallHeaders(options);
	return makeCall({
		url: finalPath,
		headers,
		data: options.data,
		method: options.method,
		params: options.params,
		timeout: options.timeout,
	});
}

function createCallPath(
	service: ServiceRegistry | App,
	options: msCallOptions | appCallOptions
) {
	const {
		protocol = "https",
		path,
		method = "GET",
		data = {}, // POST data
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

	if (!isObjectEmpty(data) && method === "GET") {
		const url = new URL(finalPath);
		Object.keys(data).forEach((key) => {
			if (isArray(data[key])) {
				data[key].forEach((el: any) => {
					url.searchParams.append(key, el);
				});
			} else url.searchParams.append(key, data[key]);
		});
		finalPath = url.toString();
	}
	return finalPath;
}

function createCallHeaders(options: msCallOptions | appCallOptions) {
	const { req, headers }: msCallOptions | appCallOptions = options;

	let newHeaders = new Headers({
		...headers,
		...addRegisterApiKeyAuthHeader(),
	});
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
	return Object.fromEntries(newHeaders.entries());
}

type remoteServiceCallInfo = {
	url: string;
	method?: HTTPMethods;
	data?: { [key: string]: any };
	params?: { [key: string]: any };
	headers: { [key: string]: string };
	timeout?: number;
};
async function makeCall(options: remoteServiceCallInfo) {
	const {
		url,
		method = "GET",
		data = {}, // POST data
		params = {}, // GET parameters (query)
		headers = {},
		timeout = 120000, // default wait in miliseconds = 2 minutes. (0 = no timeout)
	}: remoteServiceCallInfo = options;

	let axiosResponse = await axios({
		url,
		method,
		data,
		params,
		timeout,
		headers,
	});

	// axiosResponse throws error on axios error, if data is null on remote server the null is returned as empty string
	return axiosResponse.data || null;
}
