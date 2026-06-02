import fs from "node:fs";
import path from "node:path";

const [pdfPath, outputDir] = process.argv.slice(2);

if (!pdfPath || !outputDir) {
  console.error("Usage: ts-node scripts/debug/extract-pdf-jpegs.ts <pdf> <output-dir>");
  process.exit(1);
}

const buffer = fs.readFileSync(pdfPath);
const text = buffer.toString("latin1");
const imageObjectPattern = /(\d+)\s+0\s+obj([\s\S]*?)stream\r?\n/g;

fs.mkdirSync(outputDir, { recursive: true });

const extracted: Array<{ objectId: string; width: number; height: number; output: string }> = [];
let match: RegExpExecArray | null;

while ((match = imageObjectPattern.exec(text))) {
  const [full, objectId, dictionary] = match;
  if (!dictionary.includes("/Subtype/Image") || !dictionary.includes("/DCTDecode")) continue;
  const widthRaw = dictionary.match(/\/Width\s+(\d+)/)?.[1];
  const heightRaw = dictionary.match(/\/Height\s+(\d+)/)?.[1];
  if (!widthRaw || !heightRaw) continue;
  const streamStart = match.index + full.length;
  const streamEnd = text.indexOf("endstream", streamStart);
  if (streamEnd < 0) continue;

  let end = streamEnd;
  while (end > streamStart && (buffer[end - 1] === 0x0a || buffer[end - 1] === 0x0d)) end -= 1;
  const jpeg = buffer.subarray(streamStart, end);
  const output = path.join(outputDir, `image-${objectId}.jpg`);
  fs.writeFileSync(output, jpeg);
  extracted.push({ objectId, width: Number(widthRaw), height: Number(heightRaw), output });
}

console.log(JSON.stringify({ extracted: extracted.length, images: extracted }, null, 2));
