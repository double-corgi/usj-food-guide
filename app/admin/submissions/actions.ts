"use server";

import { revalidatePath } from "next/cache";
import { readSubmissions, writeSubmissions, type ProductSubmissionStatus } from "@/lib/product-submissions";

export async function updateSubmissionStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as ProductSubmissionStatus;
  if (!id || !["unreviewed", "checking", "accepted", "rejected"].includes(status)) return;

  const submissions = readSubmissions();
  const target = submissions.find((submission) => submission.id === id);
  if (!target) return;
  target.status = status;
  target.updatedAt = new Date().toISOString();
  writeSubmissions(submissions);
  revalidatePath("/admin/submissions");
}
