import fs from "node:fs";
import path from "node:path";
import type { GeneratedDataset, GeneratedFood } from "../types/generated";

const datasetPath = path.join(process.cwd(), "scripts", "output", "foods.generated.json");
const reportPath = path.join(process.cwd(), "scripts", "output", "safe-metadata-refinements.generated.json");

const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as GeneratedDataset;
const beforeImages = snapshotImages(dataset.foods);
const before = summarize(dataset.foods);
const changes: Array<{ id: string; name: string; before: { shop: string; area: string }; after: { shop: string; area: string }; reason: string }> = [];

for (const food of dataset.foods) {
  if (food.reviewStatus !== "approved" || food.canonicalFood === false || food.hidden) continue;

  const current = { shop: food.shop?.name ?? "", area: food.area?.name ?? "" };
  const fix = resolveSafeFix(food);
  if (!fix) continue;

  const nextShop = fix.shopName ?? current.shop;
  const nextArea = fix.areaName ?? current.area;
  if (nextShop === current.shop && nextArea === current.area) continue;

  setShopArea(food, nextShop, nextArea);
  food.lastCheckedAt = new Date().toISOString();
  food.last_checked_at = food.lastCheckedAt;
  changes.push({
    id: food.id,
    name: food.name,
    before: current,
    after: { shop: food.shop.name, area: food.area.name },
    reason: fix.reason
  });
}

const imageRegression = imageRegressionCount(beforeImages, snapshotImages(dataset.foods));
if (imageRegression > 0) {
  throw new Error(`Image regression detected: ${imageRegression}`);
}

if (changes.length > 0) {
  dataset.generatedAt = new Date().toISOString();
  fs.writeFileSync(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`);
}

const after = summarize(dataset.foods);
const report = {
  generatedAt: new Date().toISOString(),
  before,
  after,
  changed: changes.length,
  imageRegression,
  changes
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

type SafeFix = {
  shopName?: string;
  areaName?: string;
  reason: string;
};

function resolveSafeFix(food: GeneratedFood): SafeFix | undefined {
  const sourceText = [
    food.sourceUrl,
    food.officialUrl,
    food.shop?.officialUrl,
    ...(food.locations ?? []).map((location) => `${location.shopName} ${location.areaName} ${location.sourceUrl}`),
    ...(food.images ?? []).map((image) => `${image.sourceUrl} ${image.imageSourceContext} ${image.imageMatchReason}`)
  ].join("\n");

  if (/three-broomsticks|the-wizarding-world-of-harry-potter-food/i.test(sourceText)) {
    if (/ローストビーフ|ロティサリー|バタービールTM・シュークリーム|バタービール™・シュークリーム/.test(food.name)) {
      return {
        shopName: "三本の箒",
        areaName: "ウィザーディング・ワールド・オブ・ハリー・ポッター",
        reason: "official Harry Potter food source / Three Broomsticks image context"
      };
    }
  }

  if (/jungle-beat-shakes|super-nintendo-world-food/i.test(sourceText) && /ジャングル・ビート・シェイク|DK クラッシュサンデー/.test(food.name)) {
    return {
      shopName: "ジャングル・ビート・シェイク",
      areaName: "スーパー・ニンテンドー・ワールド",
      reason: "official Jungle Beat Shakes source/name"
    };
  }

  if (/pit-stop-popcorn/i.test(sourceText) && /ポップコーンバケツ/.test(food.name)) {
    return {
      shopName: "ピットストップ・ポップコーン",
      areaName: "スーパー・ニンテンドー・ワールド",
      reason: "official Pit Stop Popcorn source/image context"
    };
  }

  if (/boardwalk-snacks/i.test(sourceText) && /ピッツァ・デニッシュ|カルツォーネ/.test(food.name)) {
    return {
      shopName: "ボードウォーク・スナック",
      areaName: "アミティ・ビレッジ",
      reason: "official Boardwalk Snacks source/image context"
    };
  }

  if (/food-cart/i.test(sourceText) && /ピッツァ・デニッシュセット.*ツナマヨ.*サクラエビ/.test(food.name)) {
    return {
      shopName: "ボードウォーク・スナック",
      areaName: "アミティ・ビレッジ",
      reason: "official food cart map lists pizza danish set at Boardwalk Snacks"
    };
  }

  if (/amity-ice-cream/i.test(sourceText) && /アイスクリーム|スチュアート・バケツ/.test(food.name)) {
    return {
      shopName: "アミティ・アイスクリーム",
      areaName: "アミティ・ビレッジ",
      reason: "official Amity Ice Cream source/image context"
    };
  }

  if (/evil-eats/i.test(sourceText) && /大悪党|ドーナツ・バーガー|Villain/i.test(food.name)) {
    return {
      shopName: "イーブル・イーツ",
      areaName: "ミニオン・パーク",
      reason: "official Evil Eats source/image context"
    };
  }

  if (/mels-drive-in/i.test(sourceText) && /プルドポークバーガー/.test(food.name)) {
    return {
      shopName: "メルズ・ドライブイン",
      areaName: "ハリウッド・エリア",
      reason: "official Mel's Drive-In source/image context"
    };
  }

  if (/delicious-me-the-cookie-kitchen/i.test(sourceText) || /デリシャス・ミー!ザ・クッキー・キッチン/.test(food.shop?.name ?? "")) {
    return {
      shopName: "デリシャス・ミー!ザ・クッキー・キッチン",
      areaName: "ミニオン・パーク",
      reason: "official Delicious Me source/shop"
    };
  }

  if (/hello-kittys-corner-cafe/i.test(sourceText)) {
    return {
      shopName: "ハローキティのコーナーカフェ",
      areaName: "ユニバーサル・ワンダーランド",
      reason: "official Hello Kitty corner cafe source"
    };
  }

  if (/カップケーキ・ドリーム横/.test(food.shop?.name ?? "")) {
    return {
      areaName: "ユニバーサル・ワンダーランド",
      reason: "Cupcake Dream food cart location"
    };
  }

  if (/ビバリーヒルズ・ギフト前/.test(food.shop?.name ?? "")) {
    return {
      areaName: "ハリウッド・エリア",
      reason: "Beverly Hills Gifts food cart location"
    };
  }

  if (/セントラルパーク入口横/.test(food.shop?.name ?? "")) {
    return {
      areaName: "ニューヨーク・エリア",
      reason: "Central Park entrance food cart location"
    };
  }

  if (/シネマ\s*4-D\s*前フードカート/.test(sourceText)) {
    return {
      shopName: "シネマ 4-D 前フードカート",
      areaName: "ハリウッド・エリア",
      reason: "Cinema 4-D food cart location"
    };
  }

  if (/universal-cool-japan-2026\/jujutsukaisen/i.test(sourceText)) {
    if (/グレープフルーツ・レモネード/.test(food.name)) {
      return {
        shopName: "ビバリーヒルズ・ブランジェリー",
        areaName: "ハリウッド・エリア",
        reason: "official Jujutsu Kaisen page lists this original restaurant food at Beverly Hills Boulangerie"
      };
    }
    if (/黒閃|チキンピザブレッド/.test(food.name)) {
      return {
        shopName: "シネマ 4-D 前フードカート",
        areaName: "ハリウッド・エリア",
        reason: "official Jujutsu Kaisen page lists this original cart food at Cinema 4-D food cart"
      };
    }
  }

  if (/universal-cool-japan-2026\/conan\/more-enjoy/i.test(sourceText) && /蝶ネクタイ型サンドウィッチ|フルーツサングリアティー/.test(food.name)) {
    return {
      shopName: "ロンバーズ・ランディング™ 前テラス",
      areaName: "サンフランシスコ・エリア",
      reason: "official Conan page lists this food at Lombard's Landing front terrace"
    };
  }

  if (/universal-cool-japan-2026\/frieren\/restaurant/i.test(sourceText)) {
    return {
      shopName: "ロストワールド・レストラン",
      areaName: "ジュラシック・パーク",
      reason: "official Frieren restaurant page and area map list Lost World Restaurant"
    };
  }

  if (/restaurants\/kids-menu/i.test(sourceText)) {
    if (/サンドウィッチ・キッズプレート|カレー・キッズプレート/.test(food.name)) {
      return {
        shopName: "三本の箒",
        areaName: "ウィザーディング・ワールド・オブ・ハリー・ポッター",
        reason: "official kids menu gallery item lists this kids plate at Three Broomsticks"
      };
    }
    if (/キッズ・ハンバーガーセット/.test(food.name)) {
      return {
        shopName: "ディスカバリー・レストラン",
        areaName: "ジュラシック・パーク",
        reason: "official kids menu gallery item lists this kids hamburger set at Discovery Restaurant"
      };
    }
  }

  return undefined;
}

function setShopArea(food: GeneratedFood, shopName: string, areaName: string) {
  food.shop.name = shopName;
  food.area.name = areaName;
  if (food.locations?.length) {
    food.locations = food.locations.map((location, index) => ({
      ...location,
      shopName: index === 0 || isUnknown(location.shopName) ? shopName : location.shopName,
      areaName: index === 0 || isUnknown(location.areaName) || location.areaName === "その他" ? areaName : location.areaName
    }));
  }
}

function summarize(foods: GeneratedFood[]) {
  const visible = foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);
  return {
    foodTotal: visible.length,
    imageTotal: visible.filter((food) => primaryImage(food) && !primaryImage(food).startsWith("/placeholders/")).length,
    placeholderCount: visible.filter((food) => primaryImage(food).startsWith("/placeholders/")).length,
    priceKnown: visible.filter(hasKnownPrice).length,
    priceUnknown: visible.filter((food) => !hasKnownPrice(food)).length,
    shopUnknown: visible.filter((food) => isUnknown(food.shop?.name)).length,
    areaUnknown: visible.filter((food) => isUnknown(food.area?.name)).length,
    categoryUnknown: visible.filter((food) => food.category === "unknown").length
  };
}

function hasKnownPrice(food: GeneratedFood) {
  return Boolean(food.price ?? food.priceMin ?? food.price_min ?? food.locations?.find((location) => location.price)?.price);
}

function primaryImage(food: GeneratedFood) {
  return food.imageUrl ?? food.representativeImageUrl ?? food.images?.find((image) => image.enabled)?.imageUrl ?? "";
}

function isUnknown(value?: string) {
  return !value || /未確認|不明|unknown|その他/i.test(value);
}

function snapshotImages(foods: GeneratedFood[]) {
  return new Map(
    foods.map((food) => [
      food.id,
      {
        imageUrl: food.imageUrl,
        representativeImageUrl: food.representativeImageUrl,
        images: food.images?.map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
          enabled: image.enabled,
          imageVerified: image.imageVerified,
          imageApproved: image.imageApproved,
          manuallyAdded: image.manuallyAdded
        }))
      }
    ])
  );
}

function imageRegressionCount(before: ReturnType<typeof snapshotImages>, after: ReturnType<typeof snapshotImages>) {
  let count = 0;
  for (const [foodId, beforeRow] of before.entries()) {
    const afterRow = after.get(foodId);
    if (!afterRow) {
      count += 1;
      continue;
    }
    if (beforeRow.imageUrl && beforeRow.imageUrl !== afterRow.imageUrl) count += 1;
    if (beforeRow.representativeImageUrl && beforeRow.representativeImageUrl !== afterRow.representativeImageUrl) count += 1;
    const beforeEnabled = beforeRow.images?.filter((image) => image.enabled).map((image) => image.imageUrl).join("|") ?? "";
    const afterEnabled = afterRow.images?.filter((image) => image.enabled).map((image) => image.imageUrl).join("|") ?? "";
    if (beforeEnabled && beforeEnabled !== afterEnabled) count += 1;
  }
  return count;
}
