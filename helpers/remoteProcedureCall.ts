import axios from "axios";
// import type { AxiosError } from "axios";

import type { HTTPMethods } from "../../digitalniweb-types/httpMethods.js";
import {
	getAllServiceRegistryServices,
	getApp,
	getMicroservice,
	microserviceExists,
} from "./serviceRegistryCache.js";
import type {
	ServiceRegistry,
	App,
} from "../../digitalniweb-types/models/globalData.js";
import firstNonNullRemoteCall from "../functions/firstNonNullRemoteCall.js";
import type {
	msCallOptions,
	appCallOptions,
	remoteCallResponse,
	cachedResponseData,
	cacheKey,
} from "../../digitalniweb-types/custom/helpers/remoteProcedureCall.js";
import AppCache from "./appCache.js";
import type { InferAttributes } from "sequelize";

// ! cache doesn't work!
/**
 *
 * @param options
 * @returns `remoteCallResponse` this is practically Axios call. Returns Axios response. Might return object (which parameters need to be the same as axios')
 * @throws {AxiosError}
 */
export async function microserviceCall<T>(
	options: msCallOptions
): Promise<remoteCallResponse<T>> {
	const {
		name,
		id,
		scope = "single",
		cache = undefined,
	}: msCallOptions = options;

	if (!microserviceExists(name))
		throw new Error("Microservice is doesn't exist.");
	if (!options.method) options.method = "GET";

	if (name === process.env.MICROSERVICE_NAME) {
		throw new Error(
			"You don't need to call 'microserviceCall' for same microservice."
		);
	}

	if (cache) {
		let appCacheKey = AppCache.createKey(cache);
		let apiCache = AppCache.get(appCacheKey);
		if (apiCache) return apiCache;
	}

	let headers = createCallHeaders(options);
	let finalPath;
	if (scope === "single") {
		let service = await getMicroservice({
			name,
			id,
		});

		if (!service)
			throw new Error(
				"Microservice is undefined, wasn't found in cache or in serviceRegistry."
			);

		finalPath = createCallPath(service, options);

		let response = await makeCall<T>({
			url: finalPath,
			headers,
			data: options.data,
			method: options.method,
			params: options.params,
			timeout: options.timeout,
			cacheKey: AppCache.createKey(options.cache),
		});

		return response;
	} else if (scope === "all") {
		// if there was cached particular api call then it would already be retrieved. But msId (id shard) of this call could still be cached and I wouldn't need to call all services to find the right one
		let cacheIdOptions = {
			...options.cache,
			ms: name,
			type: "msId",
		} as cacheKey;
		let cacheIdKey = AppCache.createKey(cacheIdOptions);
		let cachedmsId = AppCache.get(cacheIdKey);

		if (cachedmsId) {
			let ms = await getMicroservice({ name, id: cachedmsId });
			if (ms) {
				finalPath = createCallPath(ms, options);
				let data = await makeCall<T>({
					url: finalPath,
					headers,
					data: options.data,
					method: options.method,
					params: options.params,
					timeout: options.timeout,
					cacheKey: AppCache.createKey(options.cache),
				});
				if (data.data) {
					let ttl = 120; // in seconds
					AppCache.ttl(cacheIdKey, ttl);

					// I don't want to delete the cache because data can be really null not because of the msId (shardId) being wrong. If it is wrong though it will return wrong data if not handled somewhere (which is not implemented)
				}

				return data;
			}
		}

		let services = await getAllServiceRegistryServices(name);
		if (!services)
			throw new Error(
				`Couldn't get registry services for '${name}' service.`
			);

		let requestsToServices: Promise<remoteCallResponse<T>>[] = [];
		services.forEach((service) => {
			finalPath = createCallPath(service, options);
			requestsToServices.push(
				makeCall<T>({
					url: finalPath,
					headers,
					data: options.data,
					method: options.method,
					params: options.params,
					timeout: options.timeout,
					cacheKey: AppCache.createKey(options.cache),
				})
			);
		});
		let response = await firstNonNullRemoteCall(requestsToServices);

		return response;
	} else
		throw new Error(
			"You don't need to call 'microserviceCall' for same microservice."
		);
}

function addRegisterApiKeyAuthHeader() {
	return {
		Authorization: `Bearer ${process.env.GLOBALDATA_REGISTRY_API_KEY}`,
	};
}

export async function appCall<T>(
	options: appCallOptions
): Promise<remoteCallResponse<T>> {
	const { name, cache = false } = options;
	if (!options.method) options.method = "GET";

	if (cache) {
		let apiCache = AppCache.get(options.cache);
		if (apiCache) return apiCache;
	}

	let service = await getApp(name);

	if (!service) throw new Error("App doesn't exist.");
	let finalPath = createCallPath(service, options);
	let headers = createCallHeaders(options);
	return makeCall<T>({
		url: finalPath,
		headers,
		data: options.data,
		params: options.params,
		method: options.method,
		timeout: options.timeout,
		cacheKey: AppCache.createKey(options.cache),
	});
}

function createCallPath(
	service: InferAttributes<ServiceRegistry> | InferAttributes<App>,
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

	// let urlParams = axios.getUri({url:'',params: options.params});

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

// createError(error) is Nuxt function but I use this in microservices too and typescrpit doesn't like it. Fake declare it here.
declare const createError: ((input: any) => Error) | undefined;

/**
 * returns Axios response data param
 * @param options
 */
async function makeCall<T>(
	options: remoteServiceCallInfo
): Promise<remoteCallResponse<T>> {
	let {
		url,
		method = "GET",
		data = {}, // POST data
		params = {}, // GET parameters (query)
		headers = {},
		timeout = 120000, // default maximum waiting time in miliseconds = 2 minutes. (0 = no timeout)
		cacheKey,
	}: remoteServiceCallInfo = options;

	try {
		let axiosResponse = await axios({
			url,
			method,
			data,
			params,
			timeout,
			headers,
		});

		if (method === "GET" && cacheKey && axiosResponse.status < 400) {
			let cacheData = {
				data: axiosResponse.data,
				status: 304,
			} as cachedResponseData<T>;
			if (axiosResponse?.headers?.["x-ms-id"]) {
				if (!cacheData.headers) cacheData.headers = {};
				cacheData.headers["x-ms-id"] =
					axiosResponse?.headers?.["x-ms-id"];
			} else if (axiosResponse?.headers?.["x-app-id"]) {
				if (!cacheData.headers) cacheData.headers = {};
				cacheData.headers["x-app-id"] =
					axiosResponse?.headers?.["x-app-id"];
			}
			AppCache.set(cacheKey, cacheData);
		}

		return axiosResponse;
	} catch (error: any) {
		if (error?.response?.data) error.data = error.response.data;

		if (createError) throw createError(error); // for nuxt 3

		throw error; // for microservices
	}
}
