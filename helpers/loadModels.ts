import fs from "fs/promises";
import { microservices } from "../../digitalniweb-types";
let microservice = process.env.MICROSERVICE_NAME as microservices;
/**
 * preloads (initiate) all Sequelize models so we don't need to import 'many-to-many' join tables when we need eager loading
 */
export default async function loadModels() {
	await (async function () {
		try {
			const files = await fs.readdir(`./server/models/${microservice}`);
			for (const file of files) {
				await import(
					`../../server/models/${microservice}/` +
						file.replace(/\.ts$/, ".js")
				);
			}
		} catch (err) {
			console.error("Error loading models:", err);
		}
	})();
}
