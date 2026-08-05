import { readFileSync } from "node:fs";

const domain = readFileSync("types/domain.ts", "utf8");
const localData = readFileSync("lib/local-user-data.ts", "utf8");
const useLogs = readFileSync("lib/use-food-logs.ts", "utf8");

const requiredFields = ["photoIds?: string[]", "shopId?: string", "updatedAt?: string"];
for (const field of requiredFields) {
  if (!domain.includes(field)) throw new Error(`UserFoodLog missing ${field}`);
}
for (const token of ["optionalStringArray(log.photoIds)", "optionalString(log.shopId)", "optionalString(log.updatedAt)"]) {
  if (!localData.includes(token)) throw new Error(`local user data validation missing ${token}`);
}
for (const token of ["photoIds", "shopId", "updatedAt"]) {
  if (!useLogs.includes(token)) throw new Error(`useFoodLogs does not preserve ${token}`);
}
console.log("PASS ios-n0 data compatibility: UserFoodLog is extended without removing existing fields.");
