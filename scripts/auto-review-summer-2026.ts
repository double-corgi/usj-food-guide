import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  buildImportReadyFile,
  normalizeImageUrlKey,
  runRegistrationChecks
} from "../app/admin/summer-2026-review/review-logic";
import type {
  EditableReviewData,
  ImageReviewValue,
  ReviewDecision,
  ReviewDecisionFile,
  ReviewImageCandidate,
  ReviewItem
} from "../app/admin/summer-2026-review/review-types";

type DraftFile = {
  collectionId: string;
  items: ReviewItem[];
};

type Grade = "A" | "B" | "C";

type Evidence = {
  sourceUrl: string;
  fetched: boolean;
  exactBlock: boolean;
  reason: string;
};

type Classification = {
  item: ReviewItem;
  grade: Grade;
  canAutoVerify: boolean;
  candidate: ReviewImageCandidate | null;
  foodId: string;
  reasons: string[];
  nameEvidence: string;
  imageEvidence: string;
  priceEvidence: string;
  shopEvidence: string;
  areaEvidence: string;
  duplicateEvidence: string;
  registrationAction: string;
  registrationResult: string;
};

const DRAFTS_FILE = "data/imports/unicolle-summer-2026-drafts.json";
const DECISIONS_FILE = "data/imports/unicolle-summer-2026-review-decisions.json";
const IMPORT_READY_FILE = "data/imports/unicolle-summer-2026-import-ready.json";
const REPORT_FILE = "docs/unicolle-summer-2026-auto-verification-result.md";
const OFFICIAL_HOST_RE = /(^|\.)usj\.co\.jp$/i;
const AMBIGUOUS_IMAGE_RE = /集合|複数|通常版|カップ付き|variants?|with|左右|中央|3種|三種|切り抜き禁止|候補|未採用/i;
const now = new Date().toISOString();

async function main() {
  const drafts = readJson<DraftFile>(DRAFTS_FILE);
  const decisionFile = readJson<ReviewDecisionFile>(DECISIONS_FILE);
  const existingById = new Map(decisionFile.decisions.map((decision) => [decision.proposedId, decision]));
  const sourceEvidence = await collectSourceEvidence(drafts.items);
  const classifications = await classifyItems(drafts.items, sourceEvidence);
  const decisions = drafts.items.map((item) => buildDecision(item, existingById.get(item.id), classifications.get(item.id)!));
  const ready = buildImportReadyFile(decisions, now);
  const checks = runRegistrationChecks(decisions);

  writeJson(DECISIONS_FILE, {
    schemaVersion: 1,
    sourceDraftFile: DRAFTS_FILE,
    generatedAt: decisionFile.generatedAt ?? now,
    updatedAt: now,
    decisions
  } satisfies ReviewDecisionFile);
  writeJson(IMPORT_READY_FILE, ready);
  writeReport([...classifications.values()], checks, ready.itemCount);

  const counts = countGrades([...classifications.values()]);
  console.log(
    JSON.stringify(
      {
        total: drafts.items.length,
        A: counts.A,
        B: counts.B,
        C: counts.C,
        importReady: ready.itemCount,
        registrationIssues: checks.length,
        report: REPORT_FILE
      },
      null,
      2
    )
  );
}

async function collectSourceEvidence(items: ReviewItem[]) {
  const urls = new Set<string>();
  for (const item of items) {
    for (const url of [item.sourceUrl, ...(item.officialReferenceUrls ?? []), ...(item.imageCandidates ?? []).map((candidate) => candidate.sourceUrl)]) {
      if (isOfficialUrl(url)) urls.add(url!);
    }
  }

  const evidence = new Map<string, string | null>();
  for (const url of urls) {
    evidence.set(url, await fetchText(url));
  }
  return evidence;
}

async function classifyItems(items: ReviewItem[], sourceEvidence: Map<string, string | null>) {
  const imageUrlKeys = new Map<string, string[]>();
  const fileNames = new Map<string, string[]>();
  for (const item of items) {
    for (const candidate of item.imageCandidates ?? []) {
      const key = candidate.url ? normalizeImageUrlKey(candidate.url) : "";
      if (key) imageUrlKeys.set(key, [...(imageUrlKeys.get(key) ?? []), item.id]);
      const fileName = candidate.url ? safeFileName(candidate.url) : "";
      if (fileName) fileNames.set(fileName, [...(fileNames.get(fileName) ?? []), item.id]);
    }
  }

  const pHashes = new Map<string, string>();
  const classifications = new Map<string, Classification>();

  for (const item of items) {
    const reasons: string[] = [];
    const candidates = (item.imageCandidates ?? []).filter(isUsableOfficialCandidate);
    const candidate = candidates.length === 1 ? candidates[0] : null;
    const sourceEvidenceForItem = evaluateSourceEvidence(item, candidate, sourceEvidence);

    if (item.collectionId !== "summer-2026") reasons.push("collectionIdがsummer-2026ではない");
    if (!isOfficialUrl(item.sourceUrl)) reasons.push("sourceUrlがUSJ公式ドメインではない");
    if (!item.name?.trim()) reasons.push("商品名が未確認");
    if (item.priceVerification?.status !== "official-confirmed" || item.price == null) reasons.push("公式価格が確定していない");
    if (!item.shopName?.trim()) reasons.push("店舗が未確認");
    if (!item.areaName?.trim()) reasons.push("エリアが未確認");
    if (!item.category?.trim()) reasons.push("カテゴリが未確認");
    if (!(item.officialReferenceUrls ?? []).some(isOfficialUrl)) reasons.push("公式参照URLがない");
    if (!item.importReview?.duplicateHandling?.trim()) reasons.push("重複処理方針が未確認");
    if (item.importReview?.isExisting && !item.importReview.useFoodId?.trim()) reasons.push("既存商品追記に必要なexistingFoodIdがない");
    if (hasMultipleLocations(item.shopName) || hasMultipleLocations(item.areaName)) reasons.push("複数店舗または複数エリアのため一意に確定できない");
    if (item.importReview?.isExisting && /override|variant|要確認|情報/i.test(item.importReview.duplicateHandling ?? "")) reasons.push("既存商品との統合方法が自動確定には不十分");
    if (candidates.length === 0) reasons.push("有効な公式画像候補がない");
    if (candidates.length > 1) reasons.push("候補画像が複数あり、1商品1画像に自動確定できない");
    if (candidate && AMBIGUOUS_IMAGE_RE.test(candidate.note ?? "")) reasons.push("画像候補が集合画像またはバリエーションを含む可能性がある");
    if (candidate && !sourceEvidenceForItem.exactBlock) reasons.push(sourceEvidenceForItem.reason);
    if (candidate) {
      const key = normalizeImageUrlKey(candidate.url ?? "");
      if ((imageUrlKeys.get(key) ?? []).length > 1) reasons.push("候補画像URLが別商品候補と重複している");
      const fileName = safeFileName(candidate.url);
      if ((fileNames.get(fileName) ?? []).length > 1) reasons.push("候補画像ファイル名が別商品候補と重複している");
      const hash = await perceptualHash(candidate.url ?? "");
      if (!hash) {
        reasons.push("perceptual hashを計算できない");
      } else {
        const duplicate = [...pHashes.entries()].find(([, previous]) => hammingDistance(previous, hash) <= 5);
        if (duplicate) reasons.push(`perceptual hash近似重複: ${duplicate[0]}`);
        pHashes.set(item.id, hash);
      }
    }

    const missingCritical = hasCriticalMissing(item, candidates);
    const grade: Grade = reasons.length === 0 ? "A" : missingCritical ? "C" : "B";
    classifications.set(item.id, {
      item,
      grade,
      canAutoVerify: grade === "A",
      candidate: grade === "A" ? candidate : null,
      foodId: item.importReview?.isExisting ? item.importReview.useFoodId ?? "" : item.importReview?.plannedFoodId ?? item.id,
      reasons,
      nameEvidence: sourceEvidenceForItem.fetched ? "公式ソース取得済み" : "公式ソースを取得できず、既存候補データのみ",
      imageEvidence: candidate
        ? sourceEvidenceForItem.exactBlock
          ? "商品名・価格・店舗と同一公式ブロック内の画像"
          : "公式候補だが同一ブロック未証明"
        : candidates.length > 1
          ? "公式候補が複数あり単一画像を自動選択不可"
          : "有効な単体画像候補なし",
      priceEvidence: item.priceVerification?.status === "official-confirmed" ? `公式確認済み: ${item.priceText ?? item.price}` : item.priceVerification?.status ?? "未確認",
      shopEvidence: item.shopName ?? "未確認",
      areaEvidence: item.areaName ?? "未確認",
      duplicateEvidence: item.importReview?.duplicateHandling ?? "未確認",
      registrationAction: grade === "A" ? (item.importReview?.isExisting ? "既存商品へ追記" : "manual_foodsへ新規追加") : "登録しない",
      registrationResult: "未登録"
    });
  }
  return classifications;
}

function buildDecision(item: ReviewItem, existing: ReviewDecision | undefined, classification: Classification): ReviewDecision {
  const editedData = existing?.editedData ?? buildEditableData(item);
  const autoNote = buildReviewerNote(classification);
  if (classification.grade !== "A") {
    const imageReview: ImageReviewValue = classification.grade === "C" ? "unresolved" : "candidate-only";
    return {
      proposedId: existing?.proposedId ?? item.id,
      decision: existing?.decision === "register" ? "needs_revision" : existing?.decision ?? (item.reviewStatus === "draft" ? "needs_revision" : "unreviewed"),
      editedData: {
        ...editedData,
        imageUrl: "",
        imageSourceUrl: "",
        imageReviewStatus: imageReview,
        imageReviewNote: autoNote,
        reviewStatus: editedData.reviewStatus === "approved" ? "pending" : editedData.reviewStatus
      },
      targetType: existing?.targetType ?? (item.importReview?.isExisting ? "existing" : "new"),
      existingFoodId: item.importReview?.isExisting ? existing?.existingFoodId ?? item.importReview.useFoodId ?? null : null,
      duplicateAction: existing?.duplicateAction ?? (item.importReview?.isExisting ? "existing_update" : "new_manual_food"),
      imageReview,
      priceReview: existing?.priceReview ?? item.priceVerification?.status ?? "unresolved",
      reviewerNote: autoNote,
      reviewedAt: existing?.reviewedAt ?? null
    };
  }

  const candidate = classification.candidate!;
  return {
    proposedId: existing?.proposedId ?? item.id,
    decision: "register",
    editedData: {
      ...editedData,
      imageUrl: candidate.url ?? "",
      imageSourceUrl: candidate.sourceUrl ?? "",
      imageReviewStatus: "confirmed",
      imageReviewNote: autoNote,
      imageCheckedAt: now,
      reviewStatus: "pending"
    },
    targetType: existing?.targetType ?? (item.importReview?.isExisting ? "existing" : "new"),
    existingFoodId: item.importReview?.isExisting ? existing?.existingFoodId ?? item.importReview.useFoodId ?? null : null,
    duplicateAction: existing?.duplicateAction ?? (item.importReview?.isExisting ? "existing_update" : "new_manual_food"),
    imageReview: "confirmed",
    priceReview: item.priceVerification?.status ?? "unresolved",
    reviewerNote: autoNote,
    reviewedAt: now
  };
}

function buildEditableData(item: ReviewItem): EditableReviewData {
  return {
    name: item.name,
    price: item.price ?? null,
    priceText: item.priceText ?? (item.price != null ? `${item.price.toLocaleString("ja-JP")}円` : ""),
    shopName: item.shopName ?? "",
    areaName: item.areaName ?? "",
    category: item.category ?? "",
    description: item.description ?? "",
    imageUrl: item.imageUrl ?? "",
    imageSourceUrl: item.imageSourceUrl ?? "",
    imageCandidates: item.imageCandidates ?? [],
    imageReviewStatus: (item.imageReviewStatus as ImageReviewValue) ?? "unresolved",
    imageReviewNote: item.imageReviewNote ?? "",
    imageCheckedAt: item.imageCheckedAt ?? null,
    sourceUrl: item.sourceUrl ?? "",
    officialReferenceUrls: item.officialReferenceUrls ?? [],
    collectionId: item.collectionId ?? "summer-2026",
    reviewStatus: item.reviewStatus,
    unconfirmedFields: item.unconfirmedFields ?? [],
    duplicateHandling: item.importReview?.duplicateHandling ?? item.dedupeNotes ?? "",
    priceVariants: item.priceVariants ?? []
  };
}

function evaluateSourceEvidence(item: ReviewItem, candidate: ReviewImageCandidate | null, sourceEvidence: Map<string, string | null>): Evidence {
  if (!candidate?.sourceUrl) {
    return { sourceUrl: item.sourceUrl ?? "", fetched: false, exactBlock: false, reason: "画像候補の出典URLがない" };
  }
  const html = sourceEvidence.get(candidate.sourceUrl) ?? sourceEvidence.get(item.sourceUrl ?? "") ?? null;
  if (!html) {
    return { sourceUrl: candidate.sourceUrl, fetched: false, exactBlock: false, reason: "公式ページのDOM/構造化データを取得できず同一ブロックを証明できない" };
  }
  const compact = normalizeText(html);
  const fileName = safeFileName(candidate.url);
  const hasName = compact.includes(normalizeText(item.name));
  const hasPrice = item.priceText ? compact.includes(normalizeText(item.priceText)) : item.price != null && compact.includes(String(item.price));
  const hasShop = item.shopName ? compact.includes(normalizeText(item.shopName)) : false;
  const hasImage = fileName ? compact.includes(fileName.toLowerCase()) : false;
  return {
    sourceUrl: candidate.sourceUrl,
    fetched: true,
    exactBlock: hasName && hasPrice && hasShop && hasImage,
    reason: hasName || hasPrice || hasShop || hasImage ? "公式ページ内には一部要素があるが、商品名・価格・店舗・画像の同一ブロック対応を証明できない" : "公式ページDOMに対象商品ブロックを確認できない"
  };
}

function hasCriticalMissing(item: ReviewItem, candidates: ReviewImageCandidate[]) {
  return candidates.length === 0 || item.priceVerification?.status === "unresolved" || !item.shopName || !item.areaName || !item.name || !(item.officialReferenceUrls ?? []).some(isOfficialUrl);
}

function isUsableOfficialCandidate(candidate: ReviewImageCandidate) {
  if (!candidate.url || !candidate.sourceUrl) return false;
  if (!isOfficialUrl(candidate.url) || !isOfficialUrl(candidate.sourceUrl)) return false;
  if (/googleusercontent|gstatic|encrypted-tbn|localhost|127\.0\.0\.1|blob:|data:/i.test(candidate.url)) return false;
  return true;
}

function isOfficialUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && OFFICIAL_HOST_RE.test(url.hostname);
  } catch {
    return false;
  }
}

function hasMultipleLocations(value: string | null | undefined) {
  return Boolean(value && /\/|、|・.+\/|または/.test(value));
}

async function fetchText(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, { signal: controller.signal, headers: { "user-agent": "UNICOLLE summer 2026 auto verification" } });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function perceptualHash(url: string) {
  try {
    const response = await fetch(url, { headers: { "user-agent": "UNICOLLE summer 2026 auto verification" } });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const pixels = await sharp(buffer).resize(8, 8, { fit: "fill" }).grayscale().raw().toBuffer();
    const average = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
    return [...pixels].map((value) => (value >= average ? "1" : "0")).join("");
  } catch {
    return null;
  }
}

function hammingDistance(left: string, right: string) {
  let distance = 0;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance + Math.abs(left.length - right.length);
}

function buildReviewerNote(classification: Classification) {
  const base = `auto-verification ${classification.grade}: ${classification.grade === "A" ? "official-exact-match" : classification.reasons.join(" / ")}`;
  return base.length > 1800 ? `${base.slice(0, 1797)}...` : base;
}

function writeReport(classifications: Classification[], issues: { name: string; reason: string }[], importReadyCount: number) {
  const counts = countGrades(classifications);
  const lines = [
    "# 2026年夏フード 自動検証結果",
    "",
    `- 実行日時: ${now}`,
    `- 対象件数: ${classifications.length}`,
    `- A 自動登録可能: ${counts.A}件`,
    `- B 人間確認が必要: ${counts.B}件`,
    `- C 情報不足: ${counts.C}件`,
    `- import-ready: ${importReadyCount}件`,
    "- Supabase登録結果: reviewスクリプトでは登録しない。importスクリプトでimport-readyのみ登録対象。",
    "",
    "## 判定表",
    "",
    "| 商品名 | 判定 | 自動確定 | 商品名根拠 | 画像根拠 | 価格根拠 | 店舗根拠 | エリア根拠 | 重複検査 | 使用するfoodId | 登録処理 | 登録結果 | 人間確認が必要な理由 |",
    "|---|---:|---|---|---|---|---|---|---|---|---|---|---|"
  ];

  for (const result of classifications) {
    lines.push(
      [
        result.item.name,
        result.grade,
        result.canAutoVerify ? "可" : "不可",
        result.nameEvidence,
        result.imageEvidence,
        result.priceEvidence,
        result.shopEvidence,
        result.areaEvidence,
        result.duplicateEvidence,
        result.foodId || "-",
        result.registrationAction,
        result.registrationResult,
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
  lines.push("");
  lines.push("## 自動登録しなかった理由");
  lines.push("");
  lines.push("- USJ公式の通常URLはAngularシェルHTMLで、商品名・価格・店舗・画像が同一DOMブロックにあることを機械的に証明できない商品はBへ残した。");
  lines.push("- 集合画像、複数候補、通常版/カップ付きの曖昧さ、補助価格、複数店舗/複数エリア、既存商品統合が残る商品は自動登録禁止条件に該当する。");
  writeText(REPORT_FILE, `${lines.join("\n")}\n`);
}

function countGrades(classifications: Classification[]) {
  return classifications.reduce(
    (acc, item) => {
      acc[item.grade] += 1;
      return acc;
    },
    { A: 0, B: 0, C: 0 } as Record<Grade, number>
  );
}

function normalizeText(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

function safeFileName(url: string | null | undefined) {
  if (!url) return "";
  try {
    return path.basename(new URL(url).pathname).toLowerCase();
  } catch {
    return path.basename(url.split("?")[0]).toLowerCase();
  }
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
