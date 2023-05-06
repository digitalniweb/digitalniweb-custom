import { microservices } from "../../digitalniweb-types";
import { microserviceRegistryInfo } from "../../digitalniweb-types/customFunctions/globalData";
import Microservice from "../../server/models/globalData/microservice.js";
import ServiceRegistry from "../../server/models/globalData/serviceRegistry.js";

export async function getServiceRegistryServices(options: {
	name?: microservices;
	id?: number;
}): Promise<microserviceRegistryInfo | undefined | false> {
	try {
		let where;
		if (options.id !== undefined) where = { id: options.id };
		else if (options.name) where = { name: options.name };
		else return false;
		let service = await Microservice.findOne({
			where,
			include: {
				model: ServiceRegistry,
			},
		});

		if (service === null || service.ServiceRegistries === undefined)
			return undefined;

		let serviceInfo: microserviceRegistryInfo = {
			mainId: service.mainServiceRegistryId,
			name: service.name,
			services: service.ServiceRegistries,
		};
		return serviceInfo;
	} catch (error) {
		console.log(error);
		return false;
	}
}
/**
 *
 * @returns `globalData: microserviceRegistryInfo` service information: id, host, port, apiKey etc.
 */
export async function getServiceRegistryInfo(): Promise<
	microserviceRegistryInfo | false
> {
	try {
		let serviceRegistry = await Microservice.findOne({
			where: {
				name: "globalData",
			},
			attributes: ["mainServiceRegistryId"],
			include: {
				model: ServiceRegistry,
			},
		});

		if (
			serviceRegistry === null ||
			serviceRegistry.ServiceRegistries === undefined
		)
			return false;

		let serviceRegistryInfo: microserviceRegistryInfo = {
			name: "globalData",
			mainId: serviceRegistry.mainServiceRegistryId as number,
			services: serviceRegistry.ServiceRegistries,
		};
		return serviceRegistryInfo;
	} catch (error) {
		console.log(error);
		return false;
	}
}
