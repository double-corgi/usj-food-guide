import fs from "node:fs";
import { buildManualFoodId } from "../lib/repositories/manual-foods";
import { readGeneratedFoods } from "../lib/repositories/generated-data";
import { normalizeFoodName } from "../lib/food-utils";
import type {
  EditableReviewData,
  ImageReviewValue,
  ImportReadyFile,
  PriceVerificationStatus,
  ReviewDecision,
  ReviewDecisionFile,
  ReviewImageCandidate,
  ReviewItem,
  ReviewPriceVariant,
  TargetType
} from "../app/admin/summer-2026-review/review-types";

type DraftFile = {
  collectionId: string;
  items: ReviewItem[];
};

type Grade = "approved" | "pending" | "hold";

type Classification = {
  item: ReviewItem;
  grade: Grade;
  decision: "register" | "hold";
  foodId: string;
  targetType: TargetType;
  selectedImage: ReviewImageCandidate | null;
  priceStatus: PriceVerificationStatus;
  confidence: "official-complete" | "official-partial" | "needs-human-review";
  reasons: string[];
  duplicateResult: string;
  registrationAction: string;
};

const DRAFTS_FILE = "data/imports/unicolle-summer-2026-drafts.json";
const DECISIONS_FILE = "data/imports/unicolle-summer-2026-review-decisions.json";
const IMPORT_READY_FILE = "data/imports/unicolle-summer-2026-import-ready.json";
const REPORT_FILE = "docs/unicolle-summer-2026-auto-verification-result.md";
const COLLECTION_ID = "summer-2026";
const now = new Date().toISOString();

const allowedCategories = new Set([
  "churro",
  "popcorn",
  "drink",
  "dessert",
  "burger",
  "pizza",
  "chicken",
  "rice",
  "noodle",
  "snack",
  "kids",
  "seasonal",
  "set",
  "unknown"
]);

const ambiguousImagePattern = /集合|複数|切り抜き禁止|combined|normal and|variants?|左右|左\)|右\)|中\)|3種|three|with neon|neon-cup|bottle strap/i;

async function main() {
  const drafts = readJson<DraftFile>(DRAFTS_FILE);
  const existingDecisionFile = readJson<ReviewDecisionFile>(DECISIONS_FILE);
  const generatedFoods = readGeneratedFoods({ includeHidden: true });
  const existingById = new Map(existingDecisionFile.decisions.map((decision) => [decision.proposedId, decision]));
  const classifications = drafts.items.map((item) => classifyItem(item, generatedFoods));
  const decisions = classifications.map((classification) => buildDecision(classification, existingById.get(classification.item.id)));
  const importReady = buildImportReady(decisions);
  const checks = runAutoRegistrationChecks(decisions);

  writeJson(DECISIONS_FILE, {
    schemaVersion: 1,
    sourceDraftFile: DRAFTS_FILE,
    generatedAt: existingDecisionFile.generatedAt ?? now,
    updatedAt: now,
    decisions
  } satisfies ReviewDecisionFile);
  writeJson(IMPORT_READY_FILE, importReady);
  writeReport(classifications, checks, importReady.itemCount);

  const counts = countGrades(classifications);
  console.log(
    JSON.stringify(
      {
        total: classifications.length,
        approved: counts.approved,
        pending: counts.pending,
        hold: counts.hold,
        importReady: importReady.itemCount,
        registrationIssues: checks.length,
        report: REPORT_FILE
      },
      null,
      2
    )
  );
}

function classifyItem(item: ReviewItem, generatedFoods: ReturnType<typeof readGeneratedFoods>): Classification {
  const reasons: string[] = [];
  const targetType: TargetType = item.importReview?.isExisting ? "existing" : "new";
  const selectedImage = selectPracticalOfficialImage(item);
  const priceStatus = normalizePriceStatus(item.priceVerification?.status);
  const foodId = targetType === "existing" ? item.importReview?.useFoodId ?? "" : buildManualFoodId(item.areaName ?? "", item.shopName ?? "", item.name);
  const generatedExisting = targetType === "existing" ? generatedFoods.find((food) => food.id === foodId) : null;

  if (item.collectionId !== COLLECTION_ID) reasons.push("collectionIdがsummer-2026ではありません");
  if (!isOfficialUrl(item.sourceUrl) && !(item.officialReferenceUrls ?? []).some(isOfficialUrl)) reasons.push("公式参照URLがありません");
  if (!item.name?.trim()) reasons.push("商品名が未確認です");
  if (!item.shopName?.trim()) reasons.push("店舗が未確認です");
  if (!item.areaName?.trim()) reasons.push("エリアが未確認です");
  if (!item.category?.trim()) reasons.push("カテゴリが未確認です");
  if (!item.importReview?.duplicateHandling?.trim() && !item.dedupeNotes?.trim()) reasons.push("重複処理方針が未確認です");
  if (targetType === "existing" && !foodId) reasons.push("existingFoodIdが未設定です");
  if (targetType === "existing" && !generatedExisting) reasons.push("既存foodIdがgeneratedに存在しません");

  const hasOfficialExistence = Boolean(item.name && (isOfficialUrl(item.sourceUrl) || (item.officialReferenceUrls ?? []).some(isOfficialUrl)));
  const hasPrice = item.price != null;
  const hasUsableImage = Boolean(selectedImage);
  const singleLocation = !hasMultipleLocations(item.shopName) && !hasMultipleLocations(item.areaName);
  const duplicateRisk = targetType === "existing" && !canSafelyUpdateExisting(item, generatedExisting);

  if (!hasOfficialExistence) {
    return result("hold", "hold", "needs-human-review", "登録保留: 商品存在の公式根拠不足", reasons, item, foodId, targetType, selectedImage, priceStatus);
  }
  if (duplicateRisk) {
    reasons.push("既存商品との統合で公開状態や商品内容を誤って上書きする可能性があります");
    return result("hold", "hold", "needs-human-review", "登録保留: 既存商品統合に人間確認が必要", reasons, item, foodId, targetType, selectedImage, priceStatus);
  }

  if (!hasPrice) reasons.push("価格未確認です");
  if (priceStatus === "secondary-confirmed") reasons.push("価格が補助情報確認です");
  if (!hasUsableImage) reasons.push("正式採用できる単体公式画像がありません");
  if (!singleLocation) reasons.push("複数店舗または複数エリアです");

  const approved =
    hasPrice &&
    priceStatus === "official-confirmed" &&
    hasUsableImage &&
    singleLocation &&
    item.shopName &&
    item.areaName &&
    item.category &&
    !hasAdoptedImageDuplicate(item, selectedImage);

  if (approved) {
    return result("approved", "register", "official-complete", "approved登録: 公式名・公式画像・公式価格・店舗・エリア確認済み", reasons, item, foodId, targetType, selectedImage, priceStatus);
  }

  return result("pending", "register", "official-partial", "pending登録: 公式存在確認済みだが一部情報は管理画面確認待ち", reasons, item, foodId, targetType, selectedImage, priceStatus);
}

function result(
  grade: Grade,
  decision: "register" | "hold",
  confidence: Classification["confidence"],
  registrationAction: string,
  reasons: string[],
  item: ReviewItem,
  foodId: string,
  targetType: TargetType,
  selectedImage: ReviewImageCandidate | null,
  priceStatus: PriceVerificationStatus
): Classification {
  return {
    item,
    grade,
    decision,
    foodId,
    targetType,
    selectedImage,
    priceStatus,
    confidence,
    reasons,
    duplicateResult: item.importReview?.duplicateHandling ?? item.dedupeNotes ?? "重複なし",
    registrationAction
  };
}

function selectPracticalOfficialImage(item: ReviewItem): ReviewImageCandidate | null {
  const candidates = (item.imageCandidates ?? []).filter((candidate) => {
    if (!candidate.url || !candidate.sourceUrl) return false;
    if (!isOfficialUrl(candidate.url) || !isOfficialUrl(candidate.sourceUrl)) return false;
    if (/googleusercontent|gstatic|encrypted-tbn|localhost|127\.0\.0\.1|blob:|data:/i.test(candidate.url)) return false;
    return true;
  });

  const exact = candidates.filter((candidate) => !ambiguousImagePattern.test(`${candidate.note ?? ""} ${candidate.title ?? ""} ${candidate.url ?? ""}`));
  const preferred = exact.find((candidate) => /offercard-h|infocard-h/i.test(candidate.url ?? "")) ?? exact[0];
  return preferred ?? null;
}

function canSafelyUpdateExisting(item: ReviewItem, generatedExisting: ReturnType<typeof readGeneratedFoods>[number] | null | undefined) {
  if (!item.importReview?.isExisting) return true;
  if (!generatedExisting) return false;
  if (item.price == null) return false;
  if (!selectPracticalOfficialImage(item)) return false;
  if (generatedExisting.hidden && item.priceVerification?.status !== "official-confirmed") return false;
  if (/価格は未確認|older|mismatched/i.test(`${item.importReview.registrationPolicy ?? ""} ${item.importReview.notes ?? ""}`)) return false;
  return true;
}

function hasAdoptedImageDuplicate(item: ReviewItem, selectedImage: ReviewImageCandidate | null) {
  if (!selectedImage?.url) return false;
  const key = normalizeImageUrlKey(selectedImage.url);
  const adoptedNames = new Set(["りんご飴 ～りんごのムース～", "水風船 ～ピーチゼリー＆レアチーズムース～"]);
  if (adoptedNames.has(item.name)) return true;
  return !key;
}

function buildDecision(classification: Classification, existing: ReviewDecision | undefined): ReviewDecision {
  const item = classification.item;
  const editedData = buildEditableData(item, classification);
  const reviewerNote = buildReviewerNote(classification);
  const imageReview = resolveImageReview(classification);
  return {
    proposedId: existing?.proposedId ?? item.id,
    decision: classification.decision === "register" ? "register" : "hold",
    editedData: {
      ...editedData,
      imageReviewStatus: imageReview,
      imageReviewNote: reviewerNote,
      imageCheckedAt: imageReview === "confirmed" ? now : editedData.imageCheckedAt,
      reviewStatus: classification.grade === "approved" ? "approved" : "pending"
    },
    targetType: classification.targetType,
    existingFoodId: classification.targetType === "existing" ? classification.foodId : null,
    duplicateAction: classification.targetType === "existing" ? "existing_update" : "new_manual_food",
    imageReview,
    priceReview: classification.priceStatus,
    reviewerNote,
    reviewedAt: now
  };
}

function buildEditableData(item: ReviewItem, classification: Classification): EditableReviewData {
  const selectedImage = classification.selectedImage;
  return {
    name: item.name,
    price: item.price ?? null,
    priceText: item.priceText ?? (item.price != null ? `${item.price.toLocaleString("ja-JP")}円` : ""),
    shopName: item.shopName ?? "",
    areaName: item.areaName ?? "",
    category: normalizeCategory(item.category),
    description: item.description ?? "",
    imageUrl: selectedImage?.url ?? "",
    imageSourceUrl: selectedImage?.sourceUrl ?? "",
    imageCandidates: item.imageCandidates ?? [],
    imageReviewStatus: resolveImageReview(classification),
    imageReviewNote: item.imageReviewNote ?? "",
    imageCheckedAt: item.imageCheckedAt ?? null,
    sourceUrl: item.sourceUrl ?? item.officialReferenceUrls?.[0] ?? "",
    officialReferenceUrls: item.officialReferenceUrls ?? [],
    collectionId: item.collectionId ?? COLLECTION_ID,
    reviewStatus: classification.grade === "approved" ? "approved" : "pending",
    unconfirmedFields: item.unconfirmedFields ?? [],
    duplicateHandling: item.importReview?.duplicateHandling ?? item.dedupeNotes ?? "",
    priceVariants: normalizeVariants(item.priceVariants ?? [], item.price ?? null, item.priceSource ?? item.sourceUrl ?? null)
  };
}

function resolveImageReview(classification: Classification): ImageReviewValue {
  if (classification.selectedImage) return "confirmed";
  return classification.grade === "hold" ? "candidate-only" : "unresolved";
}

function normalizeVariants(variants: ReviewPriceVariant[], fallbackPrice: number | null, fallbackSource: string | null) {
  const source = variants.length > 0 ? variants : [{ label: "通常", price: fallbackPrice, source: fallbackSource, isDefault: true } as ReviewPriceVariant & { isDefault?: boolean }];
  return source.map((variant, index) => ({
    label: variant.label ?? (index === 0 ? "通常" : `バリエーション${index + 1}`),
    price: variant.price ?? fallbackPrice,
    priceText: variant.priceText ?? (variant.price != null ? `${variant.price.toLocaleString("ja-JP")}円` : fallbackPrice != null ? `${fallbackPrice.toLocaleString("ja-JP")}円` : ""),
    source: variant.source ?? fallbackSource,
    note: variant.note ?? null
  }));
}

function buildImportReady(decisions: ReviewDecision[]): ImportReadyFile {
  const items = decisions.filter((decision) => decision.decision === "register");
  return {
    schemaVersion: 1,
    sourceDecisionFile: DECISIONS_FILE,
    generatedAt: now,
    itemCount: items.length,
    items
  };
}

function runAutoRegistrationChecks(decisions: ReviewDecision[]) {
  const issues: Array<{ name: string; reason: string }> = [];
  const registerItems = decisions.filter((decision) => decision.decision === "register");
  addDuplicateIssues(issues, registerItems, (decision) => decision.targetType === "new" ? buildManualFoodId(decision.editedData.areaName, decision.editedData.shopName, decision.editedData.name) : decision.existingFoodId ?? "", "foodId重複");
  addDuplicateIssues(issues, registerItems, (decision) => normalizeFoodName(decision.editedData.name), "商品名重複");
  addDuplicateIssues(issues, registerItems.filter((decision) => decision.editedData.imageUrl), (decision) => normalizeImageUrlKey(decision.editedData.imageUrl), "採用画像URL重複");

  for (const decision of registerItems) {
    if (!decision.editedData.collectionId) issues.push({ name: decision.editedData.name, reason: "collectionId未設定" });
    if (decision.targetType === "existing" && !decision.existingFoodId) issues.push({ name: decision.editedData.name, reason: "existingFoodId未設定" });
    if (decision.editedData.reviewStatus === "approved") {
      if (!decision.editedData.imageUrl) issues.push({ name: decision.editedData.name, reason: "approvedだが画像なし" });
      if (!decision.editedData.shopName) issues.push({ name: decision.editedData.name, reason: "approvedだが店舗なし" });
      if (!decision.editedData.areaName) issues.push({ name: decision.editedData.name, reason: "approvedだがエリアなし" });
      if (decision.editedData.price == null) issues.push({ name: decision.editedData.name, reason: "approvedだが価格なし" });
    }
  }
  return issues;
}

function addDuplicateIssues(
  issues: Array<{ name: string; reason: string }>,
  decisions: ReviewDecision[],
  getKey: (decision: ReviewDecision) => string,
  reason: string
) {
  const byKey = new Map<string, ReviewDecision[]>();
  for (const decision of decisions) {
    const key = getKey(decision);
    if (!key) continue;
    byKey.set(key, [...(byKey.get(key) ?? []), decision]);
  }
  for (const duplicated of byKey.values()) {
    if (duplicated.length < 2) continue;
    for (const decision of duplicated) issues.push({ name: decision.editedData.name, reason });
  }
}

function writeReport(classifications: Classification[], issues: Array<{ name: string; reason: string }>, importReadyCount: number) {
  const counts = countGrades(classifications);
  const lines = [
    "# 2026年夏フード 自動検証結果",
    "",
    `- 実行日時: ${now}`,
    `- 対象件数: ${classifications.length}`,
    `- approved登録可能: ${counts.approved}件`,
    `- pending登録可能: ${counts.pending}件`,
    `- 登録保留: ${counts.hold}件`,
    `- import-ready: ${importReadyCount}件`,
    "- 判定基準: 既存約200商品の運用に合わせ、公式ページで存在・店舗・画像候補を確認できる商品はpending登録対象にし、価格・公式単体画像・店舗・エリアが揃う商品はapproved登録対象にした。",
    "",
    "## 判定表",
    "",
    "| 商品名 | 判定 | foodId | 新規/既存 | 画像 | 価格 | 店舗 | エリア | confidence | DB保存先 | 公開状態 | 未確認/保留理由 |",
    "|---|---:|---|---|---|---|---|---|---|---|---|---|"
  ];

  for (const result of classifications) {
    const item = result.item;
    lines.push(
      [
        item.name,
        result.grade,
        result.foodId || "-",
        result.targetType === "existing" ? "既存追記" : "新規",
        result.selectedImage ? result.selectedImage.url : "未採用",
        item.price != null ? `${item.price.toLocaleString("ja-JP")}円 / ${result.priceStatus}` : `未確認 / ${result.priceStatus}`,
        item.shopName ?? "未確認",
        item.areaName ?? "未確認",
        result.confidence,
        result.targetType === "existing" ? "food_overrides / memberships / variants / metadata" : "manual_foods / memberships / variants / metadata",
        result.grade === "approved" ? "公開対象" : result.grade === "pending" ? "管理画面のみ" : "登録保留",
        result.reasons.length ? result.reasons.join("<br>") : "-"
      ]
        .map(escapeTable)
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |")
    );
  }

  lines.push("");
  lines.push("## 登録可能性チェック");
  lines.push("");
  if (issues.length === 0) {
    lines.push("- 指摘なし。");
  } else {
    for (const issue of issues) lines.push(`- ${issue.name}: ${issue.reason}`);
  }
  writeText(REPORT_FILE, `${lines.join("\n")}\n`);
}

function countGrades(classifications: Classification[]) {
  return classifications.reduce(
    (acc, item) => {
      acc[item.grade] += 1;
      return acc;
    },
    { approved: 0, pending: 0, hold: 0 } as Record<Grade, number>
  );
}

function buildReviewerNote(classification: Classification) {
  const reasons = classification.reasons.length ? classification.reasons.join(" / ") : "必須項目確認済み";
  return `summer-2026 practical auto-review: ${classification.grade}; ${classification.registrationAction}; ${reasons}`;
}

function normalizePriceStatus(value: string | null | undefined): PriceVerificationStatus {
  if (value === "official-confirmed" || value === "secondary-confirmed" || value === "unresolved") return value;
  return "unresolved";
}

function normalizeCategory(value: string | null | undefined) {
  if (!value) return "unknown";
  if (allowedCategories.has(value)) return value;
  if (value === "meal") return "set";
  if (value === "pasta") return "noodle";
  if (value === "dessert_drink") return "drink";
  return "seasonal";
}

function normalizeImageUrlKey(url: string) {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.split("?")[0].toLowerCase();
  }
}

function isOfficialUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)usj\.co\.jp$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function hasMultipleLocations(value: string | null | undefined) {
  return Boolean(value && /\s\/\s|、|または/.test(value));
}

function escapeTable(value: unknown) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath: string, value: string) {
  fs.writeFileSync(filePath, value, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
