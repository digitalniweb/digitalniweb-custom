import {
	microserviceRegistryInfo,
	microserviceOptions,
	serviceRegistry,
	serviceRegistryApp,
	appOptions,
} from "../../digitalniweb-types/customFunctions/globalData.js";
import { microservicesArray } from "../../digitalniweb-custom/variables/microservices.js";
import {
	microservices,
	microserviceInfoParametersType,
	microserviceInfoType,
	appInfoParametersType,
	appInfoType,
	languages,
} from "../../digitalniweb-types/index.js";
import { globalData } from "../../digitalniweb-types/models/globalData.js";
import appCache from "./appCache.js";
import { microserviceCall } from "./remoteProcedureCall.js";

import Publisher from "./../../digitalniweb-custom/helpers/publisherService.js";
import Subscriber from "./../../digitalniweb-custom/helpers/subscriberService.js";
import sleep from "../functions/sleep.js";

type getServiceOptions = {
	name: microservices;
	id?: number;
};

type setServiceOptions = {
	name: microservices;
	info: globalData.ServiceRegistry;
};
type setAppOptions = {
	name: string;
	info: globalData.App;
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
	serviceRegistryApp[name] = info as globalData.App;
}

/**
 * sets "serviceRegistry" cache for microservices
 * @param options
 * @returns
 */
export function setMicroservice(options: setServiceOptions) {
	const { name, info } = options;
	if (!info || !name) return false;
	let serviceRegistry = appCache.get("serviceRegistry") as
		| serviceRegistry
		| undefined;
	if (!serviceRegistry) {
		serviceRegistry = {} as serviceRegistry;
		serviceRegistry[name] = {
			mainId: info.id,
			services: [info as globalData.ServiceRegistry],
		};
	} else {
		let app = findCachedMicroserviceById(name, info.id);
		if (app) {
			serviceRegistry[name]?.services.push(
				info as globalData.ServiceRegistry
			);
		} else {
			serviceRegistry[name] = {
				mainId: info.id,
				services: [info as globalData.ServiceRegistry],
			};
		}
		serviceRegistry[name]?.services;
	}
	return true;
}

/**
 * returns app from "serviceRegistryApp" cache
 * @param options
 * @returns
 */
export async function getApp(
	name: string
): Promise<globalData.App | undefined> {
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
		})) as globalData.App | undefined;
		if (!app) return undefined;
		setApp({ name, info: app });
		return app;
	}

	let app = serviceRegistryAppCache[name] as globalData.App | undefined;
	if (app === undefined) {
		app = (await microserviceCall({
			name: "globalData",
			path: `/api/serviceregistry/app?name=${name}`,
		})) as globalData.App | undefined;
		if (!app) return undefined;
		setApp({ name, info: app });
	}
	return app;
}

/**
 * returns main microservice or microservice by id from "serviceRegistry" cache
 * @param options
 * @options `name`: microservice name
 * @options `id?`: microservice ID
 * @returns
 */
export async function getMicroservice(
	options: getServiceOptions
): Promise<globalData.ServiceRegistry | undefined> {
	const { name, id } = options;
	if (!microserviceExists(name)) return undefined;

	let serviceRegistryCache: serviceRegistry | undefined =
		appCache.get("serviceRegistry");
	if (serviceRegistryCache === undefined) {
		if ((await requestServiceRegistryInfo()) === false) return undefined;
		serviceRegistryCache = appCache.get("serviceRegistry");
	}

	if (serviceRegistryCache === undefined) return undefined;

	let service = {} as globalData.ServiceRegistry | undefined;

	if (id) {
		service = serviceRegistryCache[name]?.services.find((e) => e.id == id);
	} else {
		let serviceId = (serviceRegistryCache as serviceRegistry)[name]?.mainId;
		if (serviceId !== undefined)
			service = findCachedMicroserviceById(name, serviceId);
	}
	if (!service) {
		let path = `/api/serviceregistry/getbyname?name=${name}`;
		if (id) path = `/api/serviceregistry/getbyid?id=${id}`;
		if (service === undefined) {
			service = (await microserviceCall({
				name: "globalData",
				path,
			})) as globalData.ServiceRegistry | undefined;
			if (service === undefined) return undefined;
			setMicroservice({ name, info: service });
		}
	}
	return service;
}

export function findCachedMicroserviceById(
	name: microservices,
	id: number
): globalData.ServiceRegistry | undefined {
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
		/* customBELogger({
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

	let service: appOptions = {
		port: serviceInfo["PORT"],
		host: serviceInfo["HOST"],
		uniqueName: serviceInfo["APP_UNIQUE_NAME"],
		name: serviceInfo["APP_NAME"],
		apiKey: serviceInfo["APP_API_KEY"],
		appType: serviceInfo["APP_TYPE"],
		language: serviceInfo["DEFAULT_LANGUAGE"],
	};

	await microserviceCall({
		name: "globalData",
		path: "/api/serviceregistry/app/register",
		data: service,
		method: "POST",
	});
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
		/* customBELogger({
			message: `Couldn't register service ${
				process.env.MICROSERVICE_NAME
			}. ${missingServiceInfo.join(", ")} ${
				missingServiceInfo.length === 1 ? "is" : "are"
			} missing in .env file.`,
		}); */
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

	await microserviceCall({
		name: "globalData",
		path: "/api/serviceregistry/register",
		data: service,
		method: "POST",
	});
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
	} catch (error) {
		console.log(error);
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
		reject("Timed out");
	});
}
