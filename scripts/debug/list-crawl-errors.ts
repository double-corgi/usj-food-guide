import fs from "node:fs";
import path from "node:path";

const reportPath = path.join(process.cwd(), "scripts/output/latest-crawl-report.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

const sources = Array.isArray(report.sources) ? report.sources : [];
for (const source of sources) {
  const errors = Array.isArray(source.errors) ? source.errors : [];
  if (errors.length === 0) continue;
  console.log(`\n${source.sourceName}: ${errors.length} errors`);
  for (const error of errors.slice(0, 12)) console.log(`- ${error}`);
}
