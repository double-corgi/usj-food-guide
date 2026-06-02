import fs from "node:fs";
import path from "node:path";

export type ProductSubmissionStatus = "unreviewed" | "checking" | "accepted" | "rejected";
export type ProductSubmissionType = "add" | "contact" | "info_fix" | "price_fix" | "ended_report" | "image_replace" | "bug_report" | "other";

export type ProductSubmission = {
  id: string;
  requestType?: ProductSubmissionType;
  foodName: string;
  price?: string;
  shopName?: string;
  areaName?: string;
  category?: string;
  imageUrl?: string;
  officialUrl?: string;
  memo?: string;
  senderName?: string;
  contact?: string;
  status: ProductSubmissionStatus;
  createdAt: string;
  updatedAt: string;
};

const outputPath = path.join(process.cwd(), "scripts", "output", "product-submissions.generated.json");

export function readSubmissions(): ProductSubmission[] {
  try {
    if (!fs.existsSync(outputPath)) return [];
    const parsed = JSON.parse(fs.readFileSync(outputPath, "utf8")) as ProductSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSubmissions(submissions: ProductSubmission[]) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(submissions, null, 2)}\n`);
}
