import fs from "node:fs";
import path from "node:path";

export type ContactSubmissionStatus = "unreviewed" | "checking" | "closed";

export type ContactSubmission = {
  id: string;
  subject: string;
  message: string;
  senderName?: string;
  contact?: string;
  status: ContactSubmissionStatus;
  createdAt: string;
  updatedAt: string;
};

const outputPath = path.join(process.cwd(), "scripts", "output", "contact-submissions.generated.json");
const rateLimitPath = path.join(process.cwd(), "scripts", "output", "contact-rate-limit.generated.json");

export function readContactSubmissions(): ContactSubmission[] {
  try {
    if (!fs.existsSync(outputPath)) return [];
    const parsed = JSON.parse(fs.readFileSync(outputPath, "utf8")) as ContactSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeContactSubmissions(submissions: ContactSubmission[]) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(submissions, null, 2)}\n`);
}

export function canSubmitContact(key: string, intervalMs = 30000) {
  const now = Date.now();
  const limits = readRateLimits();
  const last = limits[key] ?? 0;
  if (now - last < intervalMs) return false;
  limits[key] = now;
  fs.mkdirSync(path.dirname(rateLimitPath), { recursive: true });
  fs.writeFileSync(rateLimitPath, `${JSON.stringify(limits, null, 2)}\n`);
  return true;
}

function readRateLimits(): Record<string, number> {
  try {
    if (!fs.existsSync(rateLimitPath)) return {};
    const parsed = JSON.parse(fs.readFileSync(rateLimitPath, "utf8")) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
