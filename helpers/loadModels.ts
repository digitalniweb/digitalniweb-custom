// this works I guess, but I am not using this file
// models get loaded via dynamic imports of Express routes in "/server/api/index.ts"

// import fs from "fs/promises";
// import type { microservices } from "../../digitalniweb-types";
// let microservice = process.env.MICROSERVICE_NAME as microservices;
// export default async function loadModels() {
// 	try {
// 		const files = await fs.readdir(`./server/models/${microservice}`);
// 		for (const file of files) {
// 			await import(
// 				`../../server/models/${microservice}/` +
// 					file.replace(/\.ts$/, ".js")
// 			);
// 		}
// 	} catch (err) {
// 		console.error("Error loading models:", err);
// 	}
// }
export default function loadModels() {}
