import { readFileSync } from "node:fs";

const source = readFileSync("lib/ios/share-card.ts", "utf8");
for (const check of ["canvas.width = 1080", "canvas.height = 1920", "非公式ファンアプリ", "@capacitor/share", "Directory.Cache"]) {
  if (!source.includes(check)) throw new Error(`share card missing ${check}`);
}
console.log("PASS ios-n0 share card: 1080x1920 PNG and native Share integration present.");
