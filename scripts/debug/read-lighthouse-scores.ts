import fs from "node:fs";

const files = process.argv.slice(2);

for (const file of files) {
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  const categories = report.categories ?? {};
  const scores = Object.fromEntries(
    Object.entries(categories).map(([key, value]) => [
      key,
      Math.round(((value as { score?: number }).score ?? 0) * 100),
    ]),
  );

  console.log(JSON.stringify({ file, scores }, null, 2));
}
