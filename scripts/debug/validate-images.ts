import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;
const limit = Number(process.argv[2] ?? 40);
const cachePath = path.join(process.cwd(), "scripts", "output", "image-verification-cache.json");
const cache = readCache();
const visible = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.nameQualityScore >= 60 &&
    food.confidenceScore >= 45 &&
    !food.compositeMenu
);
const urls = [
  ...new Map(
    visible.flatMap((food) => food.images.filter((image) => image.enabled && image.sourceType === "official" && image.imageVerified).map((image) => [image.imageUrl, food.name] as const))
  ).entries()
].slice(0, limit);

Promise.all(urls.map(([url, name]) => check(url, name))).then((results) => {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  const byStatus = results.reduce<Record<string, number>>((counts, result) => {
    const key = String(result.status);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  console.log(JSON.stringify({ checked: results.length, byStatus, results }, null, 2));
});

async function check(url: string, foodName: string) {
  const cached = cache[url];
  if (cached && Date.now() - Date.parse(cached.checkedAt) < 1000 * 60 * 60 * 24 * 7) {
    return { foodName, url, ...cached, cached: true };
  }
  try {
    let response = await fetch(url, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0 USJFoodListImageCheck/1.0" } });
    if (response.status === 403 || response.status === 405 || response.status >= 500) {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 USJFoodListImageCheck/1.0",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          Referer: "https://www.usj.co.jp/"
        }
      });
    }
    const result = {
      foodName,
      url,
      status: response.status,
      contentType: response.headers.get("content-type"),
      bytes: response.headers.get("content-length")
    };
    cache[url] = { status: result.status, contentType: result.contentType, bytes: result.bytes, checkedAt: new Date().toISOString() };
    return result;
  } catch (error) {
    const result = {
      foodName,
      url,
      status: "error",
      error: error instanceof Error ? error.message : String(error)
    };
    cache[url] = { status: result.status, error: result.error, checkedAt: new Date().toISOString() };
    return result;
  }
}

function readCache() {
  if (!fs.existsSync(cachePath)) return {} as Record<string, any>;
  try {
    return JSON.parse(fs.readFileSync(cachePath, "utf8")) as Record<string, any>;
  } catch {
    return {} as Record<string, any>;
  }
}
