import fs from "node:fs";
import path from "node:path";
import {
  buildDecisionFile,
  buildImportReadyFile,
  DECISIONS_FILE,
  DRAFTS_FILE,
  IMPORT_READY_FILE,
  normalizeSubmittedDecision,
  runRegistrationChecks
} from "./review-logic";
import type { ImportReadyFile, ReviewDecision, ReviewDecisionFile, ReviewItem } from "./review-types";

export type ImportData = {
  collectionId: string;
  items: ReviewItem[];
  excludedOfficialItems?: Array<{
    name: string;
    category?: string | null;
    price?: number | null;
    priceText?: string | null;
    shopName?: string | null;
    areaName?: string | null;
    sourceUrl?: string | null;
    reason?: string | null;
    imageUrl?: string | null;
    imageSourceUrl?: string | null;
    importReview?: {
      plannedFoodId?: string | null;
      duplicateHandling?: string | null;
      registrationPolicy?: string | null;
    } | null;
  }>;
};

export function readImportData(): ImportData {
  return JSON.parse(fs.readFileSync(resolvePath(DRAFTS_FILE), "utf8")) as ImportData;
}

export function readReviewDecisionFile(items: ReviewItem[]): ReviewDecisionFile {
  const filePath = resolvePath(DECISIONS_FILE);
  if (!fs.existsSync(filePath)) return buildDecisionFile(items);
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as ReviewDecisionFile;
  return buildDecisionFile(items, parsed);
}

export function saveReviewDecisionFiles(items: ReviewItem[], submittedDecisions: ReviewDecision[]) {
  const now = new Date().toISOString();
  const byId = new Map(submittedDecisions.map((decision) => [decision.proposedId, decision]));
  const missing = items.filter((item) => !byId.has(item.id)).map((item) => item.id);
  if (missing.length > 0) {
    throw new Error(`Missing review decisions: ${missing.join(", ")}`);
  }

  const decisions = items.map((item) => normalizeSubmittedDecision(item, byId.get(item.id)!, now));
  const decisionFile: ReviewDecisionFile = {
    schemaVersion: 1,
    sourceDraftFile: DRAFTS_FILE,
    generatedAt: readExistingGeneratedAt(),
    updatedAt: now,
    decisions
  };
  const importReadyFile = buildImportReadyFile(decisions, now);
  writeJsonFile(DECISIONS_FILE, decisionFile);
  writeJsonFile(IMPORT_READY_FILE, importReadyFile);

  return {
    decisions,
    importReadyFile,
    issues: runRegistrationChecks(decisions),
    savedAt: now
  };
}

export function readImportReadyFile(): ImportReadyFile {
  const filePath = resolvePath(IMPORT_READY_FILE);
  if (!fs.existsSync(filePath)) {
    return {
      schemaVersion: 1,
      sourceDecisionFile: DECISIONS_FILE,
      generatedAt: new Date().toISOString(),
      itemCount: 0,
      items: []
    };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as ImportReadyFile;
}

function readExistingGeneratedAt() {
  const filePath = resolvePath(DECISIONS_FILE);
  if (!fs.existsSync(filePath)) return new Date().toISOString();
  try {
    return (JSON.parse(fs.readFileSync(filePath, "utf8")) as ReviewDecisionFile).generatedAt ?? new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function writeJsonFile(relativePath: string, value: unknown) {
  const filePath = resolvePath(relativePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function resolvePath(relativePath: string) {
  return path.join(process.cwd(), relativePath);
}
