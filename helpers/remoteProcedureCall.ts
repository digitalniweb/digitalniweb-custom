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
import firstNonNullRemoteCall from "../functions/firstNonNullRemoteCall.js";
import {
	msCallOptions,
	appCallOptions,
	remoteCallResponse,
} from "../../digitalniweb-types/custom/helpers/remoteProcedureCall.js";
import ApiAppCache from "./apiAppCache.js";
import { customLogObject } from "~/digitalniweb-types/customHelpers/logger.js";

/**
 *
 * @param options
 * @returns `remoteCallResponse` this is practically Axios call. Returns Axios response. Might return object (which parameters need to be the same as axios') or throw an error as axios would!
 */
export async function microserviceCall(
	options: msCallOptions
): Promise<remoteCallResponse> {
	const { name, id, scope = "single" }: msCallOptions = options;
	if (!microserviceExists(name))
		throw {
			type: "functions",
			message: "Microservice is doesn't exist.",
			status: "warning",
		} as customLogObject;
	if (!options.method) options.method = "GET";

	if (name === process.env.MICROSERVICE_NAME) {
		throw {
			type: "consoleLog",
			message:
				"You don't need to call 'microserviceCall' for same microservice.",
			status: "info",
		} as customLogObject;
	}

	let apiCache = ApiAppCache.get(options);
	if (apiCache) return apiCache;

	let headers = createCallHeaders(options);
	let finalPath;
	if (scope === "single") {
		let service = await getMicroservice({
			name,
			id,
		});

		if (!service) {
			throw {
				type: "system",
				message:
					"Microservice is undefined, wasn't found in cache or in serviceRegistry.",
				status: "warning",
			} as customLogObject;
		}
		finalPath = createCallPath(service, options);

		let response = await makeCall({
			url: finalPath,
			headers,
			data: options.data,
			method: options.method,
			params: options.params,
			timeout: options.timeout,
			cacheKey: ApiAppCache.createKey(options),
		});

		return response;
	} else if (scope === "all") {
		// !!! here implement appCache get - for single scope in all scope and save id for all scope (now it is partially only this)

		// if there was cached particular api call then it would already be retrieved. But id shard of this call could still be cached and I wouldn't need to call all services to find the right one
		let cachedId = ApiAppCache.get(options, "shardId");
		if (cachedId) {
			let ms = await getMicroservice({ name, id: cachedId });
			if (ms) {
				finalPath = createCallPath(ms, options);
				let data = await makeCall({
					url: finalPath,
					headers,
					data: options.data,
					method: options.method,
					params: options.params,
					timeout: options.timeout,
					cacheKey: ApiAppCache.createKey({
						...options,
					}),
				});
				if (data) {
					ApiAppCache.resetShardIdTtl(
						ApiAppCache.createKey(options, "shardId")
					);

					// I don't want to delete the cache because data can be really null not because of the shardId being wrong. If it is wrong though it will return wrong data if not handled somewhere (which is not implemented)
				}

				return data;
			}
		}

		let services = await getAllServiceRegistryServices(name);
		if (!services) {
			throw {
				type: "system",
				message: `Scope in 'microserviceCall' is '${scope}' which is not allowed value.`,
				status: "warning",
			} as customLogObject;
		}
		let requestsToServices: Promise<remoteCallResponse>[] = [];
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
					cacheKey: ApiAppCache.createKey({
						...options,
					}),
				})
			);
		});
		let response = await firstNonNullRemoteCall(requestsToServices);

		return response;
	} else
		throw {
			type: "consoleLog",
			message:
				"You don't need to call 'microserviceCall' for same microservice.",
			status: "info",
		} as customLogObject;
}

function addRegisterApiKeyAuthHeader() {
	return {
		Authorization: `Bearer ${process.env.GLOBALDATA_REGISTRY_API_KEY}`,
	};
}

export async function appCall(
	options: appCallOptions
): Promise<remoteCallResponse> {
	const { name } = options;
	if (!options.method) options.method = "GET";

	let apiCache = ApiAppCache.get(options);
	if (apiCache) return apiCache;

	let service = await getApp(name);

	if (!service)
		throw {
			type: "functions",
			message: "App doesn't exist.",
			status: "warning",
		} as customLogObject;
	let finalPath = createCallPath(service, options);
	let headers = createCallHeaders(options);
	return makeCall({
		url: finalPath,
		headers,
		data: options.data,
		params: options.params,
		method: options.method,
		timeout: options.timeout,
		cacheKey: ApiAppCache.createKey(options),
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
	cacheKey?: string;
};

/**
 * returns Axios response data param
 * @param options
 */
async function makeCall(
	options: remoteServiceCallInfo
): Promise<remoteCallResponse> {
	let {
		url,
		method = "GET",
		data = {}, // POST data
		params = {}, // GET parameters (query)
		headers = {},
		timeout = 120000, // default maximum waiting time in miliseconds = 2 minutes. (0 = no timeout)
		cacheKey,
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

	if (axiosResponse.status < 400 && cacheKey)
		ApiAppCache.set(cacheKey, axiosResponse.data);

	return axiosResponse;
}
