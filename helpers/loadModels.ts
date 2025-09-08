// Preload all models so associations work

import fs from "fs/promises";
import type { microservices } from "../../digitalniweb-types";
let microservice = process.env.MICROSERVICE_NAME as microservices;
export default async function loadModels() {
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
}
