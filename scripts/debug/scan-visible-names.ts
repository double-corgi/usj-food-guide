import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset } from "../types/generated";

const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "output", "foods.generated.json"), "utf8")) as GeneratedDataset;

const visible = dataset.foods.filter(
  (food) =>
    food.reviewStatus === "approved" &&
    food.canonicalFood !== false &&
    !food.hidden &&
    food.displayQuality !== "low" &&
    food.nameQualityScore >= 75 &&
    food.confidenceScore >= 52 &&
    !food.compositeMenu &&
    Boolean(food.sourceUrl) &&
    (
      food.shop.name !== "店舗未確認" ||
      food.locations?.some((location) => location.shopName !== "店舗未確認") ||
      food.images.some((image) => image.enabled && image.sourceType === "official" && image.imageVerified && !image.isSharedTooMuch)
    )
);

const suspect = visible.filter((food) =>
  /Global alt|SEO|Keywords|販売場所|price amount|Url Title|Swimlane|商標|レストラン|パブ.*パブ|カフェ.*パブ|株式会社|TOP|VISION|よくあるご質問|同意しない|アレルゲン|メニュー|店舗|左.*右|中.*右|カップサラダ|ソフトドリンク|味わえる|いただく|贅沢な時間|イメージ|販売している|できます|ください|詳しくはこちら|おすすめ|ご注意|罪悪感|による.*ための|^\d+.+\s+\d+.+\s+\d+|^ドリンクボトル$/.test(food.name)
);

console.log(
  JSON.stringify(
    {
      visible: visible.length,
      suspect: suspect.map((food) => ({
        name: food.name,
        score: food.confidenceScore,
        nameScore: food.nameQualityScore,
        quality: food.displayQuality,
        review: food.reviewStatus,
        shop: food.shop.name,
        source: food.sourceNames.join(","),
        reasons: food.rejectionReasons
      }))
    },
    null,
    2
  )
);
