"use server";

import { revalidatePath } from "next/cache";
import { hasBlockedMarkup, isHoneypotFilled, isHttpUrl, isTooFast, normalizeForStorage, readLimitedField } from "@/lib/form-security";
import { readSubmissions, writeSubmissions } from "@/lib/product-submissions";

export type SubmissionState = {
  ok: boolean;
  message: string;
};

export async function submitProductRequest(_previousState: SubmissionState, formData: FormData): Promise<SubmissionState> {
  if (isHoneypotFilled(formData)) {
    return { ok: false, message: "送信内容を確認してから、もう一度お試しください。" };
  }
  if (isTooFast(formData)) {
    return { ok: false, message: "送信内容を確認してから、もう一度お試しください。" };
  }

  const foodName = normalizeForStorage(readLimitedField(formData, "foodName", 120));
  const price = normalizeForStorage(readLimitedField(formData, "price", 40));
  const shopName = normalizeForStorage(readLimitedField(formData, "shopName", 120));
  const areaName = normalizeForStorage(readLimitedField(formData, "areaName", 120));
  const category = normalizeForStorage(readLimitedField(formData, "category", 40));
  const imageUrl = normalizeForStorage(readLimitedField(formData, "imageUrl", 600));
  const officialUrl = normalizeForStorage(readLimitedField(formData, "officialUrl", 600));
  const memo = normalizeForStorage(readLimitedField(formData, "memo", 1200));
  const senderName = normalizeForStorage(readLimitedField(formData, "senderName", 80));
  const contact = normalizeForStorage(readLimitedField(formData, "contact", 160));
  const requestType = normalizeForStorage(readLimitedField(formData, "requestType", 40)) || "add";

  if (!foodName && !imageUrl && !officialUrl && !memo) {
    return { ok: false, message: "商品名、画像URL、公式URL、メモのいずれかを入力してください。" };
  }
  if (imageUrl && !isHttpUrl(imageUrl)) return { ok: false, message: "画像URLは http/https のURLを入力してください。" };
  if (officialUrl && !isHttpUrl(officialUrl)) return { ok: false, message: "公式URLは http/https のURLを入力してください。" };
  if (hasBlockedMarkup(foodName, price, shopName, areaName, category, memo, senderName, contact)) {
    return { ok: false, message: "HTMLタグやscriptを含む内容は送信できません。" };
  }
  if (isRepeatedSubmission({ foodName, imageUrl, officialUrl, memo, contact, senderName })) {
    return { ok: false, message: "連続送信を防ぐため、少し時間をおいてください。" };
  }

  const now = new Date().toISOString();
  const submissions = readSubmissions();
  submissions.unshift({
    id: `submission-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    requestType:
      requestType === "contact" ||
      requestType === "info_fix" ||
      requestType === "price_fix" ||
      requestType === "ended_report" ||
      requestType === "image_replace" ||
      requestType === "other" ||
      requestType === "bug_report"
        ? requestType
        : "add",
    foodName: foodName || "画像のみの投稿",
    price,
    shopName,
    areaName,
    category,
    imageUrl,
    officialUrl,
    memo,
    senderName,
    contact,
    status: "unreviewed",
    createdAt: now,
    updatedAt: now
  });
  writeSubmissions(submissions);
  revalidatePath("/admin/submissions");
  return { ok: true, message: "送信しました。内容確認後、必要に応じて反映します。" };
}

function isRepeatedSubmission(input: { foodName: string; imageUrl: string; officialUrl: string; memo: string; contact: string; senderName: string }) {
  const key = [input.contact, input.senderName, input.imageUrl, input.officialUrl, input.foodName, input.memo].filter(Boolean).join("|").toLowerCase();
  if (!key) return false;
  const cutoff = Date.now() - 15000;
  return readSubmissions().some((submission) => {
    const created = new Date(submission.createdAt).getTime();
    if (!Number.isFinite(created) || created < cutoff) return false;
    const submissionKey = [submission.contact, submission.senderName, submission.imageUrl, submission.officialUrl, submission.foodName, submission.memo].filter(Boolean).join("|").toLowerCase();
    return submissionKey === key;
  });
}
