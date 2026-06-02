"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import type { GeneratedDataset, GeneratedImage, GeneratedImageCandidate } from "@/scripts/types/generated";

const outputDir = path.join(process.cwd(), "scripts", "output");
const datasetPath = path.join(outputDir, "foods.generated.json");
const candidatesPath = path.join(outputDir, "image-candidates.generated.json");
const manualDecisionsPath = path.join(outputDir, "manual-image-decisions.json");

export type ManualImageState = {
  ok: boolean;
  message: string;
};

export async function approveImageCandidate(formData: FormData) {
  const candidateId = String(formData.get("candidateId") ?? "");
  mutateCandidate(candidateId, "approve");
}

export async function rejectImageCandidate(formData: FormData) {
  const candidateId = String(formData.get("candidateId") ?? "");
  mutateCandidate(candidateId, "reject");
}

export async function saveManualImageUrl(_previousState: ManualImageState, formData: FormData): Promise<ManualImageState> {
  const foodId = String(formData.get("foodId") ?? "");
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const imageSourceUrl = String(formData.get("imageSourceUrl") ?? "").trim();
  const imageSourceName = String(formData.get("imageSourceName") ?? "").trim() || "manual";
  if (!foodId) return { ok: false, message: "food_idがありません。" };
  const normalizedImageUrl = normalizeHttpUrl(imageUrl);
  if (!normalizedImageUrl) return { ok: false, message: "http/httpsの画像URLを入力してください。" };
  const normalizedSourceUrl = imageSourceUrl ? normalizeHttpUrl(imageSourceUrl) : undefined;
  if (imageSourceUrl && !normalizedSourceUrl) return { ok: false, message: "source URLはhttp/httpsで入力してください。" };

  const validation = await validateImageUrl(normalizedImageUrl);
  if (!validation.ok) return { ok: false, message: validation.message };

  const dataset = readJson<GeneratedDataset>(datasetPath, { generatedAt: new Date(0).toISOString(), summary: {}, foods: [] } as unknown as GeneratedDataset);
  const food = dataset.foods.find((item) => item.id === foodId);
  if (!food) return { ok: false, message: "対象商品が見つかりません。" };

  const now = new Date().toISOString();
  const imageId = stableId("manual-image", `${foodId}:${normalizedImageUrl}`);
  const officialConfirmed = /(^|\.)usj\.co\.jp$/i.test(getDomain(normalizedImageUrl)) || (normalizedSourceUrl ? /(^|\.)usj\.co\.jp$/i.test(getDomain(normalizedSourceUrl)) : false);
  const manualImage: GeneratedImage = {
    id: imageId,
    foodId: food.id,
    imageUrl: normalizedImageUrl,
    sourceType: officialConfirmed ? "official" : "own",
    sourceUrl: normalizedSourceUrl,
    altText: food.name,
    alt: food.name,
    width: validation.width,
    height: validation.height,
    imageConfidenceScore: 100,
    imageMatchScore: 100,
    categoryImageMatchScore: 100,
    imageSourceContext: "manual-admin-url",
    imageMatchReason: "manual-admin-approved",
    imageMismatchReason: undefined,
    imageVerified: true,
    isSharedTooMuch: false,
    hasWatermark: false,
    watermarkReason: undefined,
    imageCandidateScore: 100,
    imageSourceName,
    officialConfirmed,
    imageApproved: true,
    image_approved: true,
    manuallyAdded: true,
    manually_added: true,
    imageLastCheckedAt: now,
    image_last_checked_at: now,
    priority: 1,
    enabled: true
  };
  food.images = [manualImage, ...(food.images ?? []).filter((image) => image.id !== imageId)];
  food.imageUrl = normalizedImageUrl;
  food.image_url = normalizedImageUrl;
  food.representativeImageUrl = normalizedImageUrl;
  food.representative_image_url = normalizedImageUrl;
  food.trustedPlaceholder = false;
  food.trusted_placeholder = false;
  food.lastCheckedAt = now;
  food.last_checked_at = now;
  writeJson(datasetPath, dataset);
  writeManualDecision(foodId, { status: "manual_image_saved", imageUrl: normalizedImageUrl, sourceUrl: normalizedSourceUrl, sourceName: imageSourceName, updatedAt: now });
  revalidateAdminAndPublic(foodId);
  return { ok: true, message: "画像URLを保存しました。/foodsに反映済みです。" };
}

export async function keepPlaceholderImage(formData: FormData) {
  const foodId = String(formData.get("foodId") ?? "");
  if (!foodId) return;
  writeManualDecision(foodId, { status: "keep_placeholder", updatedAt: new Date().toISOString() });
  revalidateAdminAndPublic(foodId);
}

function mutateCandidate(candidateId: string, mode: "approve" | "reject") {
  if (!candidateId) return;
  const candidates = readJson<GeneratedImageCandidate[]>(candidatesPath, []);
  const dataset = readJson<GeneratedDataset>(datasetPath, { generatedAt: new Date(0).toISOString(), summary: {}, foods: [] } as unknown as GeneratedDataset);
  const now = new Date().toISOString();
  const candidate = candidates.find((item) => item.id === candidateId);
  if (!candidate) return;

  if (mode === "reject") {
    candidate.isApproved = false;
    candidate.isRejected = true;
    candidate.updatedAt = now;
    writeJson(candidatesPath, candidates);
    revalidateAdminAndPublic(candidate.foodId);
    return;
  }

  if (!canPublish(candidate)) {
    candidate.isApproved = false;
    candidate.isRejected = true;
    candidate.updatedAt = now;
    writeJson(candidatesPath, candidates);
    revalidateAdminAndPublic(candidate.foodId);
    return;
  }

  candidate.isApproved = true;
  candidate.isRejected = false;
  candidate.updatedAt = now;
  const food = dataset.foods.find((item) => item.id === candidate.foodId);
  if (food) {
    const imageId = stableId("approved-image", `${candidate.foodId}:${candidate.candidateUrl}`);
    const approvedImage: GeneratedImage = {
      id: imageId,
      foodId: food.id,
      imageUrl: candidate.candidateUrl,
      sourceType: candidate.officialConfirmed ? "official" : "own",
      sourceUrl: candidate.sourcePage,
      altText: food.name,
      alt: food.name,
      width: candidate.imageWidth,
      height: candidate.imageHeight,
      imageConfidenceScore: candidate.imageMatchScore,
      imageMatchScore: candidate.imageMatchScore,
      categoryImageMatchScore: candidate.isProductPhoto ? 85 : 70,
      imageSourceContext: candidate.reasons.join(", "),
      imageMatchReason: `admin-approved-candidate:${candidate.sourceName ?? candidate.sourceDomain ?? "unknown"}`,
      imageMismatchReason: undefined,
      imageVerified: true,
      isSharedTooMuch: false,
      hasWatermark: false,
      watermarkReason: undefined,
      imageCandidateScore: candidate.imageMatchScore,
      imageSourceName: candidate.sourceName ?? candidate.sourceDomain,
      officialConfirmed: candidate.officialConfirmed,
      imageLastCheckedAt: now,
      priority: 1,
      enabled: true
    };
    food.images = [approvedImage, ...food.images.filter((image) => image.id !== imageId)];
    food.imageUrl = candidate.candidateUrl;
    food.image_url = candidate.candidateUrl;
    food.representativeImageUrl = candidate.candidateUrl;
    food.representative_image_url = candidate.candidateUrl;
    food.trustedPlaceholder = false;
    food.trusted_placeholder = false;
    food.lastCheckedAt = now;
    food.last_checked_at = now;
  }
  writeJson(candidatesPath, candidates);
  writeJson(datasetPath, dataset);
  revalidateAdminAndPublic(candidate.foodId);
}

function canPublish(candidate: GeneratedImageCandidate) {
  return candidate.imageMatchScore >= 90 && !candidate.hasWatermark && candidate.isProductPhoto && !candidate.isStorefront && !candidate.isMenuBoard && !candidate.isCollage && !candidate.isCharacterOnly;
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writeManualDecision(foodId: string, decision: Record<string, unknown>) {
  const decisions = readJson<Record<string, Record<string, unknown>>>(manualDecisionsPath, {});
  decisions[foodId] = { ...(decisions[foodId] ?? {}), ...decision };
  writeJson(manualDecisionsPath, decisions);
}

function normalizeHttpUrl(value: string) {
  try {
    const parsed = new URL(value.startsWith("//") ? `https:${value}` : value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

async function validateImageUrl(url: string): Promise<{ ok: true; width?: number; height?: number } | { ok: false; message: string }> {
  const extensionLooksOk = /\.(jpe?g|png|webp|gif)(?:[?#].*)?$/i.test(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "user-agent": "uniba-food-list-admin-image-validator/1.0" }
    });
    if (!response.ok || !isImageContentType(response.headers.get("content-type"))) {
      response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "user-agent": "uniba-food-list-admin-image-validator/1.0",
          range: "bytes=0-4095"
        }
      });
    }
    const contentType = response.headers.get("content-type");
    if (!response.ok) return { ok: false, message: `画像URLを開けませんでした。HTTP ${response.status}` };
    if (!isImageContentType(contentType) && !extensionLooksOk) {
      return { ok: false, message: "画像として確認できませんでした。jpg/png/webp/gifのURLを指定してください。" };
    }
    return { ok: true, width: undefined, height: undefined };
  } catch {
    return { ok: false, message: "画像URLの確認に失敗しました。URLを直接開けるか確認してください。" };
  } finally {
    clearTimeout(timeout);
  }
}

function isImageContentType(contentType: string | null) {
  return Boolean(contentType && /^image\/(?:jpeg|jpg|png|webp|gif)/i.test(contentType));
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function stableId(prefix: string, value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return `${prefix}-${hash.toString(36)}`;
}

function revalidateAdminAndPublic(foodId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/images");
  revalidatePath("/foods");
  revalidatePath(`/foods/${foodId}`);
}
