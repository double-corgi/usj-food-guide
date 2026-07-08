import type {
  DuplicateAction,
  EditableReviewData,
  ImageReviewValue,
  ImportReadyFile,
  PriceVerificationStatus,
  RegistrationCheckIssue,
  ReviewDecision,
  ReviewDecisionFile,
  ReviewDecisionValue,
  ReviewImageCandidate,
  ReviewItem,
  ReviewPriceVariant,
  TargetType
} from "./review-types";

export const DRAFTS_FILE = "data/imports/unicolle-summer-2026-drafts.json";
export const DECISIONS_FILE = "data/imports/unicolle-summer-2026-review-decisions.json";
export const IMPORT_READY_FILE = "data/imports/unicolle-summer-2026-import-ready.json";

export const decisionLabels: Record<ReviewDecisionValue, string> = {
  unreviewed: "未判断",
  register: "登録する",
  needs_revision: "修正が必要",
  hold: "保留",
  exclude: "除外"
};

export const imageReviewLabels: Record<ImageReviewValue, string> = {
  confirmed: "画像確認済み",
  incorrect: "画像が違う",
  unresolved: "画像未確認",
  "no-image": "画像なし",
  "candidate-only": "候補あり・未採用"
};

export const priceReviewLabels: Record<string, string> = {
  "official-confirmed": "公式確認済み",
  "secondary-confirmed": "補助情報で確認",
  unresolved: "未確認"
};

export const duplicateActionLabels: Record<DuplicateAction, string> = {
  new_manual_food: "新規manual_foods候補",
  collection_add: "collection追加",
  override_add: "override追加",
  variant_add: "variant追加",
  publication_metadata_add: "publication metadata追加",
  existing_update: "既存商品へ追記",
  exclude: "除外",
  needs_review: "要確認"
};

export function buildDecisionFile(items: ReviewItem[], existingFile?: ReviewDecisionFile | null, now = new Date().toISOString()): ReviewDecisionFile {
  const existingById = new Map((existingFile?.decisions ?? []).map((decision) => [decision.proposedId, decision]));
  return {
    schemaVersion: 1,
    sourceDraftFile: DRAFTS_FILE,
    generatedAt: existingFile?.generatedAt ?? now,
    updatedAt: existingFile?.updatedAt ?? now,
    decisions: items.map((item) => normalizeDecision(item, existingById.get(item.id), now, false))
  };
}

export function normalizeSubmittedDecision(item: ReviewItem, submitted: ReviewDecision, now: string): ReviewDecision {
  return normalizeDecision(item, submitted, now, true);
}

export function buildInitialDecision(item: ReviewItem): ReviewDecision {
  return normalizeDecision(item, undefined, new Date().toISOString(), false);
}

export function buildImportReadyFile(decisions: ReviewDecision[], now = new Date().toISOString()): ImportReadyFile {
  const items = decisions.filter(isImportReadyItem);
  return {
    schemaVersion: 1,
    sourceDecisionFile: DECISIONS_FILE,
    generatedAt: now,
    itemCount: items.length,
    items
  };
}

export function runRegistrationChecks(decisions: ReviewDecision[]): RegistrationCheckIssue[] {
  const issues: RegistrationCheckIssue[] = [];
  const registerItems = decisions.filter((decision) => decision.decision === "register");

  addDuplicateIssues(issues, registerItems, (decision) => normalizeKey(decision.editedData.name), "登録する商品の商品名が重複しています");
  addDuplicateIssues(issues, registerItems, (decision) => decision.proposedId.trim(), "proposedIdが重複しています");
  addDuplicateIssues(
    issues,
    registerItems.filter((decision) => Boolean(decision.editedData.imageUrl.trim())),
    (decision) => decision.editedData.imageUrl.trim(),
    "画像URLが重複しています"
  );

  for (const decision of decisions) {
    if (decision.editedData.reviewStatus === "approved") addIssue(issues, decision, "approvedが含まれています");
  }

  for (const decision of registerItems) {
    if (!decision.editedData.name.trim()) addIssue(issues, decision, "商品名未確認");
    if (!decision.proposedId.trim()) addIssue(issues, decision, "proposedId不明");
    if (decision.targetType === "existing" && !decision.existingFoodId?.trim()) addIssue(issues, decision, "既存foodId不明");
    if (!decision.editedData.collectionId.trim()) addIssue(issues, decision, "collectionId不明");
    if (decision.priceReview === "unresolved" || !decision.editedData.priceText.trim()) addIssue(issues, decision, "価格未確認");
    if (decision.imageReview === "incorrect") addIssue(issues, decision, "画像が違う");
    if (decision.imageReview === "unresolved" || decision.imageReview === "candidate-only") addIssue(issues, decision, imageReviewLabels[decision.imageReview]);
    if (!decision.editedData.imageUrl.trim() && decision.imageReview !== "no-image") addIssue(issues, decision, "画像未確認");
    if (decision.editedData.imageUrl.trim() && !decision.editedData.imageSourceUrl.trim()) addIssue(issues, decision, "画像出典URL未登録");
    if (!decision.editedData.shopName.trim()) addIssue(issues, decision, "店舗未確認");
    if (!decision.editedData.areaName.trim()) addIssue(issues, decision, "エリア未確認");
    if (!decision.editedData.sourceUrl.trim() && decision.editedData.officialReferenceUrls.length === 0) addIssue(issues, decision, "公式URL未登録");
    if (decision.duplicateAction === "needs_review" || !decision.editedData.duplicateHandling.trim()) addIssue(issues, decision, "重複処理方針なし");
  }

  return issues;
}

export function isImportReadyItem(decision: ReviewDecision) {
  if (decision.decision !== "register") return false;
  if (decision.imageReview === "incorrect" || decision.imageReview === "unresolved" || decision.imageReview === "candidate-only") return false;
  if (!decision.editedData.name.trim()) return false;
  if (!decision.editedData.shopName.trim()) return false;
  if (!decision.editedData.areaName.trim()) return false;
  if (!decision.editedData.duplicateHandling.trim() || decision.duplicateAction === "needs_review") return false;
  if (decision.editedData.imageUrl.trim() && !decision.editedData.imageSourceUrl.trim()) return false;
  if (!decision.editedData.imageUrl.trim() && decision.imageReview !== "no-image") return false;
  if (decision.targetType === "existing" && !decision.existingFoodId?.trim()) return false;
  if (decision.editedData.reviewStatus === "approved") return false;
  return true;
}

export function normalizePriceVariantsInput(value: string): ReviewPriceVariant[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label = "", priceText = "", note = ""] = line.split("|").map((part) => part.trim());
      return {
        label,
        priceText,
        price: parsePrice(priceText),
        note,
        source: null
      };
    });
}

export function formatPriceVariantsForInput(variants: ReviewPriceVariant[] | undefined) {
  return (variants ?? [])
    .map((variant) => [variant.label ?? "", variant.priceText ?? (variant.price != null ? `${variant.price.toLocaleString("ja-JP")}円` : ""), variant.note ?? ""].join(" | "))
    .join("\n");
}

export function normalizeStringListInput(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parsePrice(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/[^\d]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function inferExistingFoodId(item: ReviewItem) {
  return item.importReview?.useFoodId ?? item.importReview?.plannedFoodId ?? item.duplicateCandidates?.find((candidate) => candidate.foodId || candidate.id)?.foodId ?? item.duplicateCandidates?.find((candidate) => candidate.foodId || candidate.id)?.id ?? null;
}

export function inferDuplicateAction(item: ReviewItem): DuplicateAction {
  const text = `${item.importReview?.duplicateHandling ?? ""} ${item.importReview?.registrationPolicy ?? ""}`;
  if (!item.importReview?.isExisting) return "new_manual_food";
  if (/variant|バリエーション|価格variant/i.test(text)) return "variant_add";
  if (/override|補正|情報をoverride/i.test(text)) return "override_add";
  if (/summer-2026|collection|コレクション|紐付け/i.test(text)) return "collection_add";
  if (/publication/i.test(text)) return "publication_metadata_add";
  return "existing_update";
}

export function deriveExistingActionLabels(decision: ReviewDecision, item: ReviewItem) {
  if (decision.targetType !== "existing") return [];
  const labels = new Set<string>();
  const text = `${decision.duplicateAction} ${decision.editedData.duplicateHandling} ${item.importReview?.registrationPolicy ?? ""}`;
  if (/collection|summer-2026|コレクション|紐付け/.test(text)) labels.add(duplicateActionLabels.collection_add);
  if (/override|補正|情報/.test(text)) labels.add(duplicateActionLabels.override_add);
  if (/variant|バリエーション/.test(text)) labels.add(duplicateActionLabels.variant_add);
  labels.add(duplicateActionLabels.publication_metadata_add);
  return Array.from(labels);
}

function normalizeDecision(item: ReviewItem, source: ReviewDecision | undefined, now: string, markReviewed: boolean): ReviewDecision {
  const targetType: TargetType = source?.targetType ?? (item.importReview?.isExisting ? "existing" : "new");
  const editedData = normalizeEditedData(item, source?.editedData);
  const imageReview = normalizeImageReview(source?.imageReview ?? editedData.imageReviewStatus ?? item.imageReviewStatus ?? "unresolved", editedData.imageCandidates);
  const decision = normalizeDecisionValue(source?.decision ?? (item.reviewStatus === "draft" ? "needs_revision" : "unreviewed"), imageReview);
  const normalizedEditedData = {
    ...editedData,
    imageReviewStatus: imageReview
  };

  return {
    proposedId: source?.proposedId?.trim() || item.id,
    decision,
    editedData: normalizedEditedData,
    targetType,
    existingFoodId: targetType === "existing" ? source?.existingFoodId?.trim() || inferExistingFoodId(item) : null,
    duplicateAction: normalizeDuplicateAction(source?.duplicateAction ?? inferDuplicateAction(item), targetType),
    imageReview,
    priceReview: normalizePriceReview(source?.priceReview ?? item.priceVerification?.status ?? "unresolved"),
    reviewerNote: source?.reviewerNote ?? "",
    reviewedAt: markReviewed ? now : source?.reviewedAt ?? null
  };
}

function normalizeEditedData(item: ReviewItem, source?: EditableReviewData): EditableReviewData {
  const sourceUrl = source?.sourceUrl ?? item.sourceUrl ?? "";
  const officialReferenceUrls = source?.officialReferenceUrls ?? item.officialReferenceUrls ?? [];
  const priceText = source?.priceText ?? item.priceText ?? (item.price != null ? `${item.price.toLocaleString("ja-JP")}円` : "");

  return {
    name: source?.name ?? item.name,
    price: source?.price ?? item.price ?? parsePrice(priceText),
    priceText,
    shopName: source?.shopName ?? item.shopName ?? "",
    areaName: source?.areaName ?? item.areaName ?? "",
    category: source?.category ?? item.category ?? "",
    description: source?.description ?? item.description ?? "",
    imageUrl: source?.imageUrl ?? item.imageUrl ?? "",
    imageSourceUrl: source?.imageSourceUrl ?? item.imageSourceUrl ?? "",
    imageCandidates: normalizeImageCandidates(
      [
        ...(source?.imageUrl ? [{ url: source.imageUrl, sourceUrl: source.imageSourceUrl, title: source.name, note: "Edited image URL retained as a candidate for review." }] : []),
        ...(item.imageCandidates ?? []),
        ...(source?.imageCandidates ?? [])
      ],
      item
    ),
    imageReviewStatus: normalizeImageReview(source?.imageReviewStatus ?? item.imageReviewStatus ?? "unresolved", source?.imageCandidates ?? item.imageCandidates ?? []),
    imageReviewNote: source?.imageReviewNote ?? item.imageReviewNote ?? "",
    imageCheckedAt: source?.imageCheckedAt ?? item.imageCheckedAt ?? null,
    sourceUrl,
    officialReferenceUrls,
    collectionId: source?.collectionId ?? item.collectionId ?? "summer-2026",
    reviewStatus: source?.reviewStatus ?? item.reviewStatus,
    unconfirmedFields: source?.unconfirmedFields ?? item.unconfirmedFields ?? [],
    duplicateHandling: source?.duplicateHandling ?? item.importReview?.duplicateHandling ?? item.dedupeNotes ?? "",
    priceVariants: source?.priceVariants ?? item.priceVariants ?? []
  };
}

function normalizeDecisionValue(value: string, imageReview: ImageReviewValue): ReviewDecisionValue {
  if ((imageReview === "incorrect" || imageReview === "candidate-only" || imageReview === "unresolved") && value === "register") return "needs_revision";
  if (value === "register" || value === "needs_revision" || value === "hold" || value === "exclude" || value === "unreviewed") return value;
  return "unreviewed";
}

export function normalizeImageReview(value: string | null | undefined, candidates: ReviewImageCandidate[] = []): ImageReviewValue {
  if (value === "confirmed" || value === "incorrect" || value === "unresolved" || value === "no-image" || value === "candidate-only") return value;
  if (value === "verified") return "confirmed";
  if (value === "wrong") return "incorrect";
  if (value === "no_image_planned") return "no-image";
  if (value === "unconfirmed") return candidates.length > 0 ? "candidate-only" : "unresolved";
  return candidates.length > 0 ? "candidate-only" : "unresolved";
}

function normalizePriceReview(value: string): PriceVerificationStatus {
  if (value === "official-confirmed" || value === "secondary-confirmed" || value === "unresolved") return value;
  return "unresolved";
}

function normalizeDuplicateAction(value: string, targetType: TargetType): DuplicateAction {
  const allowed: DuplicateAction[] = ["new_manual_food", "collection_add", "override_add", "variant_add", "publication_metadata_add", "existing_update", "exclude", "needs_review"];
  if (allowed.includes(value as DuplicateAction)) return value as DuplicateAction;
  return targetType === "existing" ? "existing_update" : "new_manual_food";
}

export function normalizeImageCandidates(candidates: ReviewImageCandidate[], item?: ReviewItem): ReviewImageCandidate[] {
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const normalized: ReviewImageCandidate[] = [];
  for (const candidate of candidates) {
    const url = candidate.url?.trim();
    if (!url || !/^https?:\/\//i.test(url)) continue;
    const key = normalizeImageUrlKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      url,
      sourceUrl: candidate.sourceUrl?.trim() || item?.imageSourceUrl || item?.sourceUrl || null,
      sourceType: candidate.sourceType ?? inferImageSourceType(candidate.sourceUrl ?? item?.sourceUrl ?? item?.imageSourceUrl),
      title: candidate.title ?? item?.name ?? null,
      note: candidate.note ?? null,
      discoveredAt: candidate.discoveredAt ?? now,
      status: candidate.status ?? "candidate"
    });
  }
  return normalized;
}

export function normalizeImageUrlKey(url: string) {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.split("?")[0].toLowerCase();
  }
}

function inferImageSourceType(url: string | null | undefined) {
  if (!url) return "unknown";
  if (/usj\.co\.jp\/contentdata\/usj\/ja\/jp\/restaurants\//.test(url)) return "official-restaurant";
  if (/usj\.co\.jp\/web\/ja\/jp\/restaurants\/seasonal-food|usj\.co\.jp\/web\/ja\/jp\/events\//.test(url)) return "official-event";
  if (/usj\.co\.jp/.test(url)) return "official-usj";
  return "secondary";
}

function addDuplicateIssues(issues: RegistrationCheckIssue[], decisions: ReviewDecision[], getKey: (decision: ReviewDecision) => string, reason: string) {
  const byKey = new Map<string, ReviewDecision[]>();
  for (const decision of decisions) {
    const key = getKey(decision);
    if (!key) continue;
    byKey.set(key, [...(byKey.get(key) ?? []), decision]);
  }
  for (const duplicated of byKey.values()) {
    if (duplicated.length < 2) continue;
    for (const decision of duplicated) addIssue(issues, decision, reason);
  }
}

function addIssue(issues: RegistrationCheckIssue[], decision: ReviewDecision, reason: string) {
  issues.push({
    proposedId: decision.proposedId,
    name: decision.editedData.name || decision.proposedId,
    reason
  });
}

function normalizeKey(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}
