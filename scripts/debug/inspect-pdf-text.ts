import { fetchBuffer } from "../utils/http";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: ts-node scripts/debug/inspect-pdf-text.ts <pdf-url>");
    process.exit(1);
  }
  const { PDFParse } = await import("pdf-parse");
  const buffer = await fetchBuffer(url, { timeoutMs: 20000, retries: 1 });
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();
  await parser.destroy?.();
  const lines = parsed.text
    .split(/\n|\r/)
    .map((line) => line.trim())
    .filter(Boolean);
  console.log(
    JSON.stringify(
      {
        url,
        lineCount: lines.length,
        sample: lines.slice(0, 120),
        foodLike: lines
          .filter((line) => /pizza|burger|pasta|spaghetti|kid|cake|drink|rice|curry|ピザ|バーガー|パスタ|キッズ|ケーキ|ドリンク|ライス|カレー/i.test(line))
          .slice(0, 120)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
