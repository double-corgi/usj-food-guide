const blockedMarkupPattern = /<\s*\/?\s*[a-z][^>]*>|javascript:|data:text\/html|onerror\s*=|onload\s*=|<\s*script/i;

export function readLimitedField(formData: FormData, key: string, maxLength: number) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

export function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function hasBlockedMarkup(...values: string[]) {
  return values.some((value) => blockedMarkupPattern.test(value));
}

export function normalizeForStorage(value: string) {
  return value.replace(/\u0000/g, "").trim();
}

export function isHoneypotFilled(formData: FormData) {
  return Boolean(String(formData.get("companyWebsite") ?? "").trim());
}

export function isTooFast(formData: FormData, minimumMs = 1200) {
  const submittedAt = Number(formData.get("submittedAt") ?? 0);
  if (!Number.isFinite(submittedAt) || submittedAt <= 0) return false;
  return Date.now() - submittedAt < minimumMs;
}
