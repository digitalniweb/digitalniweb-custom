import axios, { AxiosResponse } from "axios";

import { HTTPMethods } from "../../digitalniweb-types/httpMethods.js";
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
import { log } from "./logger.js";
import firstNonNullPromise from "../functions/firstNonNullPromise.js";
import { msCallOptions } from "~/digitalniweb-types/custom/helpers/remoteProcedureCall.js";
import ApiAppCache from "./apiAppCache.js";

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

	// !!! apiCache not complete (saving + timeouts? + false / null? + appCall no implemented) and weird - should it be here?
	let apiCache = ApiAppCache.get(options);
	if (apiCache !== undefined) return apiCache;

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
		let response = await firstNonNullPromise(requestsToServices);

		return response;
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
	const { protocol = "https", path }: msCallOptions | appCallOptions =
		options;
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

	// let urlParams = axios.getUri({url:'',params: {...options.data,...options.params}});

	return finalPath;
}

function createCallHeaders(options: msCallOptions | appCallOptions) {
	const { req, headers }: msCallOptions | appCallOptions = options;

	let newHeaders = new Headers({
		...headers,
		...addRegisterApiKeyAuthHeader(),
	});
	if (req) {
		newHeaders.set(
			"x-forwarded-for",
			req.headers.get("x-forwarded-for") || "service"
		);
		newHeaders.set(
			"user-agent",
			req.headers.get("user-agent") || "service"
		);
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
	let {
		url,
		method = "GET",
		data = {}, // POST data
		params = {}, // GET parameters (query)
		headers = {},
		timeout = 120000, // default wait in miliseconds = 2 minutes. (0 = no timeout)
	}: remoteServiceCallInfo = options;

	if (method === "GET") {
		params = {
			...data,
			...params,
		};
		data = {};
	}

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
