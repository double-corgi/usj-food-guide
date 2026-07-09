import fs from "node:fs";
import { buildManualFoodId } from "../lib/repositories/manual-foods";
import { normalizeFoodName } from "../lib/food-utils";
import type { ImportReadyFile, ReviewDecisionFile } from "../app/admin/summer-2026-review/review-types";

const DRAFTS_FILE = "data/imports/unicolle-summer-2026-drafts.json";
const DECISIONS_FILE = "data/imports/unicolle-summer-2026-review-decisions.json";
const IMPORT_READY_FILE = "data/imports/unicolle-summer-2026-import-ready.json";

function main() {
  const drafts = readJson<{ items: Array<{ id: string; name: string; imageUrl?: string | null }> }>(DRAFTS_FILE);
  const decisions = readJson<ReviewDecisionFile>(DECISIONS_FILE).decisions;
  const importReady = readJson<ImportReadyFile>(IMPORT_READY_FILE);
  const issues: string[] = [];

  if (drafts.items.length !== 30) issues.push(`draft item count is ${drafts.items.length}, expected 30`);
  if (decisions.length !== 30) issues.push(`decision count is ${decisions.length}, expected 30`);
  if (importReady.itemCount !== importReady.items.length) issues.push("import-ready itemCount mismatch");

  const readyIds = importReady.items.map((decision) => resolveFoodId(decision));
  assertNoDuplicates(issues, readyIds, "foodId");
  assertNoDuplicates(issues, importReady.items.map((decision) => normalizeFoodName(decision.editedData.name)), "normalizedName");
  assertNoDuplicates(
    issues,
    importReady.items.map((decision) => normalizeImageUrlKey(decision.editedData.imageUrl)).filter(Boolean),
    "adoptedImageUrl"
  );

  for (const decision of decisions) {
    if (decision.editedData.reviewStatus !== "approved" && decision.editedData.reviewStatus !== "pending") {
      issues.push(`${decision.editedData.name}: unsupported reviewStatus ${decision.editedData.reviewStatus}`);
    }
  }

  for (const decision of importReady.items) {
    if (decision.decision !== "register") issues.push(`${decision.editedData.name}: import-ready contains non-register decision`);
    if (!decision.editedData.collectionId) issues.push(`${decision.editedData.name}: collectionId missing`);
    if (decision.targetType === "existing" && !decision.existingFoodId) issues.push(`${decision.editedData.name}: existingFoodId missing`);
    if (decision.editedData.reviewStatus === "approved") {
      if (!decision.editedData.imageUrl) issues.push(`${decision.editedData.name}: approved without imageUrl`);
      if (!decision.editedData.shopName) issues.push(`${decision.editedData.name}: approved without shopName`);
      if (!decision.editedData.areaName) issues.push(`${decision.editedData.name}: approved without areaName`);
      if (decision.editedData.price == null) issues.push(`${decision.editedData.name}: approved without price`);
    }
  }

  const approved = decisions.filter((decision) => decision.decision === "register" && decision.editedData.reviewStatus === "approved").length;
  const pending = decisions.filter((decision) => decision.decision === "register" && decision.editedData.reviewStatus === "pending").length;
  const hold = decisions.filter((decision) => decision.decision !== "register").length;
  const newCount = importReady.items.filter((decision) => decision.targetType === "new").length;
  const existingCount = importReady.items.filter((decision) => decision.targetType === "existing").length;

  const result = {
    drafts: drafts.items.length,
    decisions: decisions.length,
    importReady: importReady.itemCount,
    approved,
    pending,
    hold,
    newCount,
    existingCount,
    issues
  };
  console.log(JSON.stringify(result, null, 2));
  if (issues.length > 0) process.exit(1);
}

function resolveFoodId(decision: ImportReadyFile["items"][number]) {
  if (decision.targetType === "existing") return decision.existingFoodId ?? "";
  return buildManualFoodId(decision.editedData.areaName, decision.editedData.shopName, decision.editedData.name);
}

function assertNoDuplicates(issues: string[], values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) issues.push(`${label} duplicate: ${value}`);
    seen.add(value);
  }
}

function normalizeImageUrlKey(url: string | null | undefined) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.search = "";
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.split("?")[0].toLowerCase();
  }
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

main();
