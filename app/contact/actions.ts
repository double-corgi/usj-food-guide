"use server";

import { revalidatePath } from "next/cache";
import { canSubmitContact, readContactSubmissions, writeContactSubmissions } from "@/lib/contact-submissions";
import { hasBlockedMarkup, isHoneypotFilled, isTooFast, normalizeForStorage, readLimitedField } from "@/lib/form-security";

export type ContactState = {
  ok: boolean;
  message: string;
};

export async function submitContact(_previousState: ContactState, formData: FormData): Promise<ContactState> {
  if (isHoneypotFilled(formData)) {
    return { ok: false, message: "送信内容を確認してから、もう一度お試しください。" };
  }
  if (isTooFast(formData)) {
    return { ok: false, message: "送信内容を確認してから、もう一度お試しください。" };
  }

  const subject = normalizeForStorage(readLimitedField(formData, "subject", 120));
  const message = normalizeForStorage(readLimitedField(formData, "message", 1200));
  const senderName = normalizeForStorage(readLimitedField(formData, "senderName", 80));
  const contact = normalizeForStorage(readLimitedField(formData, "contact", 160));

  if (!subject || !message) return { ok: false, message: "件名と内容を入力してください。" };
  if (hasBlockedMarkup(subject, message, senderName, contact)) return { ok: false, message: "HTMLタグやscriptを含む内容は送信できません。" };

  const rateKey = (contact || senderName || "anonymous").toLowerCase();
  if (!canSubmitContact(rateKey)) return { ok: false, message: "連続送信を防ぐため、少し時間をおいてください。" };

  const now = new Date().toISOString();
  const submissions = readContactSubmissions();
  submissions.unshift({
    id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    subject,
    message,
    senderName,
    contact,
    status: "unreviewed",
    createdAt: now,
    updatedAt: now
  });
  writeContactSubmissions(submissions);
  revalidatePath("/admin/submissions");
  return { ok: true, message: "お問い合わせを送信しました。必要に応じて内容を確認します。" };
}
