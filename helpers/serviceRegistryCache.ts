import {
	microserviceRegistryInfo,
	microserviceOptions,
	serviceRegistry,
	serviceRegistryApp,
	newAppOptions,
} from "../../digitalniweb-types/customFunctions/globalData.js";
import { microservicesArray } from "../../digitalniweb-custom/variables/microservices.js";
import {
	microservices,
	microserviceInfoParametersType,
	microserviceInfoType,
	appInfoParametersType,
	appInfoType,
} from "../../digitalniweb-types/index.js";
import {
	ServiceRegistry as ServiceRegistryType,
	App as AppType,
	ServiceRegistry,
	App,
} from "../../digitalniweb-types/models/globalData.js";
import appCache from "./appCache.js";
import { microserviceCall } from "./remoteProcedureCall.js";

import Publisher from "./../../digitalniweb-custom/helpers/publisherService.js";
import Subscriber from "./../../digitalniweb-custom/helpers/subscriberService.js";
import sleep from "../functions/sleep.js";
import {
	getMainServiceRegistry,
	getServiceRegistryInfo,
	getServiceRegistryServices,
} from "../../custom/helpers/globalData/serviceRegistry.js";
import { serviceRegistryServices } from "../../digitalniweb-types/custom/helpers/globalData/serviceRegistry.js";

import { Microservice as MicroserviceType } from "../../digitalniweb-types/models/globalData.js";
import { log } from "./logger.js";

type getServiceOptions = {
	name: microservices;
	id?: number;
};

type setAppOptions = {
	name: string;
	info: AppType;
};

export function setMainIdService(options: {
	name: microservices;
	id: number;
}): boolean {
	let { name, id } = options;
	let serviceRegistryApp = appCache.get("serviceRegistry") as
		| serviceRegistry
		| undefined;
	if (serviceRegistryApp?.[name] === undefined) return false;

	if (findCachedMicroserviceById(name, id) === undefined) return false;

	(serviceRegistryApp[name] as microserviceRegistryInfo).mainId = id;
	return true;
}

/**
 * sets "serviceRegistryApp" for apps
 * @param options
 */
export function setApp(options: setAppOptions) {
	const { name, info } = options;
	if (!info || !name) return false;
	let serviceRegistryApp = appCache.get("serviceRegistryApp") as
		| serviceRegistryApp
		| undefined;
	if (!serviceRegistryApp) {
		serviceRegistryApp = {};
	}
	serviceRegistryApp[name] = info as AppType;
}

/**
 * returns app from "serviceRegistryApp" cache
 * @param options
 * @returns
 */
export async function getApp(name: string): Promise<AppType | undefined> {
	if (!name) return undefined;

	let serviceRegistryAppCache: serviceRegistryApp | undefined =
		appCache.get("serviceRegistryApp");
	if (serviceRegistryAppCache === undefined) {
		let serviceRegistryCache: serviceRegistry | undefined =
			appCache.get("serviceRegistry");
		if (serviceRegistryCache === undefined) {
			if ((await requestServiceRegistryInfo()) === false)
				return undefined;
		}
		let app = (await microserviceCall({
			name: "globalData",
			path: `/api/serviceregistry/app?name=${name}`,
		})) as AppType | undefined;
		if (!app) return undefined;
		setApp({ name, info: app });
		return app;
	}

	let app = serviceRegistryAppCache[name] as AppType | undefined;
	if (app === undefined) {
		app = (await microserviceCall({
			name: "globalData",
			path: `/api/serviceregistry/app?name=${name}`,
		})) as AppType | undefined;
		if (!app) return undefined;
		setApp({ name, info: app });
	}
	return app;
}

/**
 *
 * @returns cached serviceRegistry or at least load `globalData` inside. If `globalData` couldn't be fetched return undefined
 */
export async function getServiceRegistry(): Promise<
	serviceRegistry | undefined
> {
	let serviceRegistryCache: serviceRegistry | undefined =
		appCache.get("serviceRegistry");

	if (serviceRegistryCache === undefined) {
		if (process.env.MICROSERVICE_NAME === "globalData") {
			let serviceRegistryInfo = await getServiceRegistryInfo();
			if (serviceRegistryInfo === false) return undefined;
			appCache.set("serviceRegistry", {
				globalData: serviceRegistryInfo,
			});
		} else {
			if ((await requestServiceRegistryInfo()) === false)
				return undefined;
		}
		serviceRegistryCache = appCache.get("serviceRegistry");
	}

	return serviceRegistryCache;
}

/**
 * This doesn't return cached services but always fetches it from `globalData`. That's why it is used for setting cache in `setServiceServicesByName`.
 * @param name `microservices`
 * @returns `serviceRegistryServices`
 */
export async function getServiceServicesByName(
	name: microservices
): Promise<serviceRegistryServices> {
	let microserviceInfo: serviceRegistryServices;
	if (process.env.MICROSERVICE_NAME === "globalData") {
		microserviceInfo = await getServiceRegistryServices(name);
	} else {
		let path = `/api/serviceregistry/${name}`;
		microserviceInfo = await microserviceCall({
			name: "globalData",
			path,
		});
	}
	return microserviceInfo;
}

/**
 * Sets and overwrites cache for certain microservice registry information `MicroserviceRegistryInfo`
 * Used when Redis messaging system sends `updateMicroserviceRegistryInfo` when any microservice is updated, added or removed. Then if there is this microservice cached then overwrite it.
 * !!! this is not implemented, but needs to be!!!
 * @param name `microservices`
 * @returns boolean
 */
export async function setServiceServicesByName(
	name: microservices
): Promise<serviceRegistryServices> {
	let services = await getServiceServicesByName(name);
	if (!services) return false;
	let serviceRegistryCache = await getServiceRegistry();
	if (!serviceRegistryCache) return false;
	serviceRegistryCache[name] = services;
	return services;
}

/**
 * @returns all microservice shards (all microservices of the same name i.e. 'websites_ms')
 */
export async function getAllServiceRegistryServices(
	name: microservices
): Promise<microserviceRegistryInfo["services"] | undefined> {
	if (!microserviceExists(name)) return undefined;

	let serviceRegistryCache = await getServiceRegistry();

	if (serviceRegistryCache === undefined) return undefined;
	let services = serviceRegistryCache[name];
	if (services) return services.services;

	let microserviceInfo = await getServiceServicesByName(name);
	if (!microserviceInfo) return undefined;

	serviceRegistryCache[name] = microserviceInfo;
	return microserviceInfo.services;
}

/**
 * @param options
 * @options `name`: microservice name
 * @options `id?`: microservice ID
 * @returns main microservice or microservice by id from "serviceRegistry" cache
 */
export async function getMicroservice(
	options: getServiceOptions
): Promise<ServiceRegistryType | undefined> {
	const { name, id } = options;
	if (!microserviceExists(name)) return undefined;

	let serviceRegistryCache = await getServiceRegistry();

	if (serviceRegistryCache === undefined) return undefined;

	let service = undefined as ServiceRegistryType | undefined;

	let findId: number | undefined = id || serviceRegistryCache[name]?.mainId;
	if (findId) service = findCachedMicroserviceById(name, findId);

	if (service) return service;
	let microserviceInfo = await getServiceServicesByName(name);
	if (!microserviceInfo) return undefined;

	let mainMicroservice = microserviceInfo.services.find(
		(e) => e.id == (microserviceInfo as microserviceRegistryInfo).mainId
	);

	if (!mainMicroservice) return undefined;

	serviceRegistryCache[name] = microserviceInfo;
	return mainMicroservice;
}

export function findCachedMicroserviceById(
	name: microservices,
	id: number
): ServiceRegistryType | undefined {
	let serviceRegistryCache: serviceRegistry | undefined =
		appCache.get("serviceRegistry");
	if (!serviceRegistryCache?.[name]) return undefined;
	return serviceRegistryCache[name]?.services.find((e) => {
		return e.id == id;
	});
}
export function findCachedMicroserviceIndexById(
	name: microservices,
	id: number
): number | undefined {
	let serviceRegistryCache: serviceRegistry | undefined =
		appCache.get("serviceRegistry");
	if (!serviceRegistryCache?.[name]) return undefined;
	return serviceRegistryCache[name]?.services.findIndex((e) => {
		return e.id == id;
	});
}

export function microserviceExists(service: microservices): boolean {
	return microservicesArray.includes(service);
}

export async function registerCurrentApp() {
	let missingServiceInfo: appInfoParametersType[] = [];

	let serviceInfo = {} as appInfoType;

	let serviceInfoParameters: Array<appInfoParametersType> = [
		"PORT",
		"HOST",
		"APP_UNIQUE_NAME",
		"APP_NAME",
		"APP_API_KEY",
		"DEFAULT_LANGUAGE",
		"APP_TYPE",
	];

	serviceInfoParameters.forEach((e) => {
		if (process.env[e] == undefined) missingServiceInfo.push(e);
		else {
			if (e === "PORT") {
				if (Number.isInteger(Number(serviceInfo[e])))
					throw new Error("Current's app PORT is not a number!");
				serviceInfo[e] = process.env[e];
			} else if (e === "DEFAULT_LANGUAGE") {
				serviceInfo[e] = process.env[e];
			} else {
				// e === 'string'
				serviceInfo[e] = process.env[e];
			}
		}
	});

	if (missingServiceInfo.length !== 0) {
		/* log({
			message: `Couldn't register service ${
				process.env.APP_NAME
			}. ${missingServiceInfo.join(", ")} ${
				missingServiceInfo.length === 1 ? "is" : "are"
			} missing in .env file.`,
		}); */
		throw new Error(
			`Couldn't register service ${
				process.env.APP_NAME
			}. ${missingServiceInfo.join(", ")} ${
				missingServiceInfo.length === 1 ? "is" : "are"
			} missing in .env file.`
		);
	}

	let service: newAppOptions = {
		port: serviceInfo["PORT"],
		host: serviceInfo["HOST"],
		uniqueName: serviceInfo["APP_UNIQUE_NAME"],
		name: serviceInfo["APP_NAME"],
		apiKey: serviceInfo["APP_API_KEY"],
		appType: serviceInfo["APP_TYPE"],
		language: serviceInfo["DEFAULT_LANGUAGE"],
	};

	let app: App | false = await microserviceCall({
		name: "globalData",
		path: "/api/serviceregistry/app/register",
		data: service,
		method: "POST",
	});
	if (!app) throw new Error("Couldn't register app.");

	process.env.APP_ID = app.id;

	return app;
}

export async function registerCurrentMicroservice() {
	let missingServiceInfo: microserviceInfoParametersType[] = [];

	let serviceInfo = {} as microserviceInfoType;

	let serviceInfoParameters: Array<microserviceInfoParametersType> = [
		"PORT",
		"HOST",
		"MICROSERVICE_UNIQUE_NAME",
		"MICROSERVICE_NAME",
		"MICROSERVICE_API_KEY",
	];

	serviceInfoParameters.forEach((e) => {
		if (process.env[e] == undefined) missingServiceInfo.push(e);
		else {
			if (e === "PORT") {
				if (Number.isInteger(Number(serviceInfo[e])))
					throw new Error(
						"Current's microservice PORT is not a number!"
					);
				serviceInfo[e] = process.env[e];
			} else if (e === "MICROSERVICE_NAME") {
				serviceInfo[e] = process.env[e];
			} else {
				// e === 'string'
				serviceInfo[e] = process.env[e];
			}
		}
	});

	if (missingServiceInfo.length !== 0) {
		throw new Error(
			`Couldn't register service ${
				process.env.MICROSERVICE_NAME
			}. ${missingServiceInfo.join(", ")} ${
				missingServiceInfo.length === 1 ? "is" : "are"
			} missing in .env file.`
		);
	}

	let service: microserviceOptions = {
		port: serviceInfo["PORT"],
		host: serviceInfo["HOST"],
		uniqueName: serviceInfo["MICROSERVICE_UNIQUE_NAME"],
		name: serviceInfo["MICROSERVICE_NAME"],
		apiKey: serviceInfo["MICROSERVICE_API_KEY"],
	};

	let currentService: false | ServiceRegistry = await microserviceCall({
		name: "globalData",
		path: "/api/serviceregistry/register",
		data: service,
		method: "POST",
	});

	if (currentService) process.env.MICROSERVICE_ID = currentService.id;
}

/**
 * gets serviceRegistry information <microserviceRegistryInfo>
 * @returns void
 */
export async function requestServiceRegistryInfo(
	forceRequest = false
): Promise<boolean> {
	try {
		let serviceRegistryCache: serviceRegistry | undefined =
			appCache.get("serviceRegistry");
		if (
			!forceRequest &&
			serviceRegistryCache !== undefined &&
			serviceRegistryCache.globalData !== undefined
		)
			return true;
		if (serviceRegistryCache === undefined) serviceRegistryCache = {};
		let response = await requestServiceRegistryInfoFromRedisEvent(
			Subscriber,
			"pmessage"
		);
		serviceRegistryCache.globalData = response;
		appCache.set("serviceRegistry", serviceRegistryCache);
		return true;
	} catch (error: any) {
		log({
			type: "functions",
			status: "warning",
			message: "Request service registry info failed.",
			error,
		});
		return false;
	}
}

function requestServiceRegistryInfoFromRedisEvent(
	item: typeof Subscriber,
	event: string
): Promise<microserviceRegistryInfo> {
	return new Promise(async (resolve, reject) => {
		if (
			!process.env.MICROSERVICE_UNIQUE_NAME &&
			!process.env.APP_UNIQUE_NAME
		)
			reject("MICROSERVICE_UNIQUE_NAME or APP_UNIQUE_NAME missing");
		const uniqueName = process.env.MICROSERVICE_UNIQUE_NAME
			? process.env.MICROSERVICE_UNIQUE_NAME
			: process.env.APP_UNIQUE_NAME;
		const listener = (
			pattern: string,
			channel: string,
			message: string
		) => {
			if (pattern === "serviceRegistry-responseInformation-*") {
				let requestedService = channel.replace(
					/^serviceRegistry-responseInformation-/,
					""
				);
				if (requestedService != uniqueName) return;
				item.off(event, listener);
				resolve(JSON.parse(message));
			}
		};

		item.on(event, listener);

		await Publisher.publish(
			"serviceRegistry-requestInformation",
			uniqueName
		);
		await sleep(3000);
		item.off(event, listener);
		reject("Timed out request service registry info from Redis event");
	});
}

export async function getMainServiceRegistryId(
	microservice: microservices
): Promise<number | null> {
	try {
		let id = appCache.get(microservice, "mainServiceRegistryId") as
			| number
			| undefined;
		if (id) return id;

		let ms: MicroserviceType | null;
		if (process.env.MICROSERVICE_NAME === "globalData") {
			ms = await getMainServiceRegistry(microservice);
		} else {
			ms = (await microserviceCall({
				name: "globalData",
				path: `/api/serviceregistry/getmainbyname/${microservice}`,
				method: "GET",
			})) as MicroserviceType | null;
		}
		if (ms === null || !ms.mainServiceRegistryId) return null;
		id = ms.mainServiceRegistryId;
		appCache.set(microservice, id, "mainServiceRegistryId");
		return id;
	} catch (error: any) {
		log({
			type: "functions",
			status: "warning",
			message: "Get main service registry id by name failed.",
			error,
		});
		return null;
	}
}
