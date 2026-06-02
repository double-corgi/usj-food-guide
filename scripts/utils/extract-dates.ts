export function extractDates(text: string) {
  const normalized = text.normalize("NFKC");
  const dateMatches = Array.from(
    normalized.matchAll(/(20\d{2})[年\/.-]\s?(\d{1,2})[月\/.-]\s?(\d{1,2})日?/g)
  ).map((match) => toDate(match[1], match[2], match[3]));

  const range = normalized.match(/(\d{1,2})月(\d{1,2})日[^\d]{1,8}(\d{1,2})月(\d{1,2})日/);
  if (range) {
    const year = new Date().getFullYear().toString();
    dateMatches.push(toDate(year, range[1], range[2]), toDate(year, range[3], range[4]));
  }

  return {
    startDate: dateMatches[0],
    endDate: dateMatches[1]
  };
}

function toDate(year: string, month: string, day: string) {
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
