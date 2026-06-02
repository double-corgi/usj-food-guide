export function parsePrice(text: string) {
  const normalized = text.normalize("NFKC").replace(/,/g, "");
  const matches = [...normalized.matchAll(/[￥¥]\s?(\d{2,6})|(\d{2,6})\s?円/g)]
    .map((match) => Number(match[1] || match[2]))
    .filter((value) => Number.isFinite(value) && value >= 50 && value <= 6000);
  if (matches.length === 0) return undefined;
  const preferred = matches.find((value) => value >= 300 && value <= 4500);
  return preferred ?? matches[0];
}
