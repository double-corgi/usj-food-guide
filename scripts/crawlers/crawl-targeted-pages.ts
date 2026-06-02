import type { CrawlSourceResult } from "../types/crawler";
import { parseCastelChurros } from "../utils/castel-churro-parser";
import { fetchText } from "../utils/http";
import { extractInternalLinks, parseFoodsFromHtml } from "../utils/html-food-parser";
import { parseFoodsFromTcmJson, webUrlToTridionUrl } from "../utils/tcm-parser";

type TargetMode =
  | "coverage"
  | "churro"
  | "popcorn"
  | "drink"
  | "dessert"
  | "snack"
  | "walkfood"
  | "foodcarts"
  | "seasonal"
  | "limited"
  | "nintendo"
  | "minion"
  | "harrypotter"
  | "pizza"
  | "burger"
  | "pasta"
  | "kids"
  | "restaurantmenus"
  | "prices";

type TargetConfig = {
  sourceName: string;
  seeds: string[];
  keyword: RegExp;
  linkPattern: RegExp;
  maxPages: number;
};

const restaurantDetailSeeds = [
  "https://www.usj.co.jp/web/ja/jp/restaurants/kinopios-cafe",
  "https://www.usj.co.jp/web/ja/jp/restaurants/yoshis-snack-island",
  "https://www.usj.co.jp/web/ja/jp/restaurants/pit-stop-popcorn",
  "https://www.usj.co.jp/web/ja/jp/restaurants/mario-cafe-and-store",
  "https://www.usj.co.jp/web/ja/jp/restaurants/three-broomsticks",
  "https://www.usj.co.jp/web/ja/jp/restaurants/hogs-head",
  "https://www.usj.co.jp/web/ja/jp/restaurants/studio-stars-restaurant",
  "https://www.usj.co.jp/web/ja/jp/restaurants/mels-drive-in",
  "https://www.usj.co.jp/web/ja/jp/restaurants/discovery-restaurant",
  "https://www.usj.co.jp/web/ja/jp/restaurants/amity-landing-restaurant",
  "https://www.usj.co.jp/web/ja/jp/restaurants/louies-ny-pizza-parlor",
  "https://www.usj.co.jp/web/ja/jp/restaurants/happiness-cafe",
  "https://www.usj.co.jp/web/ja/jp/restaurants/snoopy-backlot-cafe",
  "https://www.usj.co.jp/web/ja/jp/restaurants/hello-kitty-corner-cafe",
  "https://www.usj.co.jp/web/ja/jp/restaurants/hello-kittys-corner-cafe",
  "https://www.usj.co.jp/web/ja/jp/restaurants/beverly-hills-boulangerie",
  "https://www.usj.co.jp/web/ja/jp/restaurants/kids-menu",
  "https://www.usj.co.jp/web/ja/jp/restaurants/park-side-grille",
  "https://www.usj.co.jp/web/ja/jp/restaurants/saido",
  "https://www.usj.co.jp/web/ja/jp/restaurants/the-dragons-pearl",
  "https://www.usj.co.jp/web/ja/jp/restaurants/fossil-fuels",
  "https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snack",
  "https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snacks",
  "https://www.usj.co.jp/web/ja/jp/restaurants/amity-ice-cream",
  "https://www.usj.co.jp/web/ja/jp/restaurants/wharf-cafe",
  "https://www.usj.co.jp/web/ja/jp/restaurants/evil-eats",
  "https://www.usj.co.jp/web/ja/jp/restaurants/jungle-beat-shakes",
  "https://www.usj.co.jp/web/ja/jp/restaurants/lost-world-restaurant",
  "https://www.usj.co.jp/web/ja/jp/restaurants/delicious-me-the-cookie-kitchen",
  "https://www.usj.co.jp/web/ja/jp/restaurants/finnegans-bar-and-grill",
  "https://www.usj.co.jp/web/ja/jp/restaurants/lombards-landing",
  "https://www.usj.co.jp/web/ja/jp/restaurants/azurra-di-capri",
  "https://www.usj.co.jp/web/ja/jp/restaurants/the-flying-dinosaur-snack"
];

const sharedFoodSeeds = [
  "https://www.usj.co.jp/web/ja/jp/restaurants",
  "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
  "https://www.usj.co.jp/web/ja/jp/restaurants/popcorn-cart",
  "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/super-nintendo-world-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/minion-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/the-wizarding-world-of-harry-potter-food",
  "https://www.usj.co.jp/web/ja/jp/restaurants/mario-cafe-and-store",
  "https://www.usj.co.jp/web/ja/jp/restaurants/pit-stop-popcorn",
  "https://www.usj.co.jp/web/ja/jp/restaurants/yoshis-snack-island",
  "https://www.usj.co.jp/web/ja/jp/restaurants/hogs-head",
  "https://www.usj.co.jp/web/ja/jp/restaurants/wharf-cafe",
  ...restaurantDetailSeeds,
  "https://castel.jp/p/3101"
];

const eventSeeds = [
  "https://www.usj.co.jp/company/news/2026/0513/",
  "https://www.usj.co.jp/company/news/2026/0423/",
  "https://www.usj.co.jp/company/news/2026/0422/",
  "https://www.usj.co.jp/company/news/2026/0318/",
  "https://www.usj.co.jp/company/news/2025/0321/",
  "https://www.usj.co.jp/company/news/2024/0206/",
  "https://www.usj.co.jp/web/ja/jp/events",
  "https://www.usj.co.jp/web/ja/jp/events/summer-2026/universal-summer/matsuri-nights",
  "https://www.usj.co.jp/web/ja/jp/areas/super-nintendo-world/5th-anniversary-food",
  "https://www.usj.co.jp/food/winter2019/index.html"
];

const targetConfigs: Record<TargetMode, TargetConfig> = {
  coverage: {
    sourceName: "official-complete-coverage",
    seeds: [...sharedFoodSeeds, ...eventSeeds],
    keyword: /チュリトス|チュロス|ポップコーン|バケツ|ドリンク|ソーダ|ラテ|スムージー|フローズン|カクテル|ジュース|ケーキ|サンデー|アイス|パフェ|スイーツ|ターキー|チキン|ホットドッグ|フードカート|ワゴン|期間限定|限定|コラボ|フード|メニュー/i,
    linkPattern: /\/web\/ja\/jp\/(?:restaurants|events|areas)|\/company\/news\/20|\/food\//i,
    maxPages: Number(process.env.CRAWL_MAX_COVERAGE_PAGES ?? 160)
  },
  churro: {
    sourceName: "official-category-churros",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
      "https://castel.jp/p/3101",
      "https://www.usj.co.jp/web/ja/jp/restaurants/yoshis-snack-island",
      "https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snack",
      "https://www.usj.co.jp/web/ja/jp/restaurants/fossil-fuels",
      "https://www.usj.co.jp/web/ja/jp/restaurants/delicious-me-the-cookie-kitchen",
      "https://www.usj.co.jp/company/news/2026/0513/",
      "https://www.usj.co.jp/company/news/2026/0422/",
      "https://www.usj.co.jp/company/news/2024/0206/"
    ],
    keyword: /チュリトス|チュロス|churro|churros|フードカート|食べ歩き|スナックカート/i,
    linkPattern: /chur|food-cart|seasonal-food|restaurants|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 60)
  },
  popcorn: {
    sourceName: "official-category-popcorn",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/popcorn-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/pit-stop-popcorn",
      "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/yoshis-snack-island",
      "https://www.usj.co.jp/company/news/2026/0513/",
      "https://www.usj.co.jp/web/ja/jp/areas/super-nintendo-world/5th-anniversary-food"
    ],
    keyword: /ポップコーン|popcorn|バケツ|バケット|カート/i,
    linkPattern: /popcorn|food-cart|pit-stop|restaurants|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 60)
  },
  drink: {
    sourceName: "official-category-drinks",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants/mario-cafe-and-store",
      "https://www.usj.co.jp/web/ja/jp/restaurants/hogs-head",
      "https://www.usj.co.jp/web/ja/jp/restaurants/park-side-grille",
      "https://www.usj.co.jp/web/ja/jp/restaurants/beverly-hills-boulangerie",
      "https://www.usj.co.jp/web/ja/jp/restaurants/wharf-cafe",
      "https://www.usj.co.jp/web/ja/jp/restaurants/amity-ice-cream",
      "https://www.usj.co.jp/web/ja/jp/restaurants/happiness-cafe",
      "https://www.usj.co.jp/company/news/2026/0513/"
    ],
    keyword: /ドリンク|ソーダ|ラテ|スムージー|フローズン|カクテル|ジュース|コーヒー|ビール|シェイク|ティー|drink|latte|soda/i,
    linkPattern: /drink|cafe|hogs-head|restaurant|food-cart|seasonal-food|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 70)
  },
  dessert: {
    sourceName: "official-category-desserts",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants/beverly-hills-boulangerie",
      "https://www.usj.co.jp/web/ja/jp/restaurants/delicious-me-the-cookie-kitchen",
      "https://www.usj.co.jp/food/winter2019/index.html"
    ],
    keyword: /ケーキ|サンデー|アイス|パフェ|スイーツ|クッキー|チョコ|プリン|ワッフル|シュークリーム|dessert|cake|ice|sweets/i,
    linkPattern: /dessert|sweets|ice|boulangerie|cookie|food-cart|seasonal-food|restaurants|events|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 60)
  },
  snack: {
    sourceName: "official-category-snacks",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/wharf-cafe",
      "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snack",
      "https://www.usj.co.jp/web/ja/jp/restaurants/fossil-fuels",
      "https://www.usj.co.jp/web/ja/jp/restaurants/yoshis-snack-island",
      "https://www.usj.co.jp/web/ja/jp/restaurants/the-flying-dinosaur-snack"
    ],
    keyword: /スナック|食べ歩き|ホットドッグ|ポテト|ナゲット|ターキー|チキン|ポークリブ|まん|パイ|フードカート/i,
    linkPattern: /snack|food-cart|wharf|seasonal-food|restaurants|events|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 60)
  },
  walkfood: {
    sourceName: "official-walk-food",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/popcorn-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants/yoshis-snack-island",
      "https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snack",
      "https://www.usj.co.jp/web/ja/jp/restaurants/fossil-fuels",
      "https://www.usj.co.jp/web/ja/jp/restaurants/the-flying-dinosaur-snack",
      "https://www.usj.co.jp/web/ja/jp/restaurants/minion-food",
      "https://www.usj.co.jp/company/news/2026/0513/"
    ],
    keyword: /食べ歩き|フードカート|ワゴン|スナック|ターキーレッグ|チュリトス|チュロス|ポップコーン|ホットドッグ|まん|肉まん|ドリンク|ソーダ|フローズン/i,
    linkPattern: /food-cart|popcorn-cart|seasonal-food|yoshis|minion-food|restaurants|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 80)
  },
  foodcarts: {
    sourceName: "official-food-carts",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/popcorn-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/boardwalk-snack",
      "https://www.usj.co.jp/web/ja/jp/restaurants/fossil-fuels",
      "https://www.usj.co.jp/web/ja/jp/restaurants/yoshis-snack-island",
      "https://www.usj.co.jp/company/news/2026/0513/"
    ],
    keyword: /フードカート|ポップコーンカート|ドリンクワゴン|ワゴン|食べ歩き|チュリトス|ターキーレッグ|ポップコーン/i,
    linkPattern: /food-cart|popcorn-cart|restaurants|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 70)
  },
  seasonal: {
    sourceName: "official-seasonal-food",
    seeds: [...eventSeeds, "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food"],
    keyword: /期間限定|限定|季節|イベント|コラボ|ハロウィーン|クリスマス|イースター|クールジャパン|ワンピース|summer|limited/i,
    linkPattern: /seasonal|events|news|cool-japan|halloween|christmas|summer|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 90)
  },
  limited: {
    sourceName: "official-limited-food",
    seeds: [...eventSeeds, "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food"],
    keyword: /期間限定|限定|イベント|コラボ|周年|アニバーサリー|ハロウィーン|クリスマス|イースター|summer|limited/i,
    linkPattern: /seasonal|events|news|limited|summer|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 90)
  },
  nintendo: {
    sourceName: "official-area-nintendo-food",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/areas/super-nintendo-world",
      "https://www.usj.co.jp/web/ja/jp/areas/super-nintendo-world/5th-anniversary-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants/kinopios-cafe",
      "https://www.usj.co.jp/web/ja/jp/restaurants/yoshis-snack-island",
      "https://www.usj.co.jp/web/ja/jp/restaurants/pit-stop-popcorn"
    ],
    keyword: /マリオ|ルイージ|ピーチ|キノピオ|ヨッシー|ドンキー|Nintendo|ニンテンドー|ポップコーン|ドリンク|カフェ|フード/i,
    linkPattern: /nintendo|kinopios|yoshis|pit-stop|mario|restaurants|areas|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 80)
  },
  minion: {
    sourceName: "official-area-minion-food",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/areas/minion-park",
      "https://www.usj.co.jp/web/ja/jp/restaurants/minion-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants/delicious-me-the-cookie-kitchen"
    ],
    keyword: /ミニオン|ティム|ボブ|スチュアート|デイブ|Minion|クッキー|ポップコーン|チュリトス|ドリンク/i,
    linkPattern: /minion|delicious|food-cart|restaurants|areas|events|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 70)
  },
  harrypotter: {
    sourceName: "official-area-harry-potter-food",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/the-wizarding-world-of-harry-potter-food",
      "https://www.usj.co.jp/web/ja/jp/areas/the-wizarding-world-of-harry-potter",
      "https://www.usj.co.jp/web/ja/jp/restaurants/three-broomsticks",
      "https://www.usj.co.jp/web/ja/jp/restaurants/hogs-head"
    ],
    keyword: /ハリー|ポッター|ホグワーツ|ホグズミード|三本の箒|ホッグズ|バタービール|パンプキン|ロースト|パイ|ドリンク|ビール|フード|メニュー/i,
    linkPattern: /harry|wizarding|three-broomsticks|hogs-head|restaurants|areas|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 70)
  },
  pizza: {
    sourceName: "official-category-pizza",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/louies-ny-pizza-parlor",
      "https://www.usj.co.jp/web/ja/jp/restaurants/azurra-di-capri",
      "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants",
      ...restaurantDetailSeeds
    ],
    keyword: /ピザ|ピッツァ|pizza|マルゲリータ|ペパロニ|クアトロ|チーズ|デニッシュ/i,
    linkPattern: /pizza|azurra|louies|restaurants|seasonal-food|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 90)
  },
  burger: {
    sourceName: "official-category-burgers-and-sandwiches",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/mels-drive-in",
      "https://www.usj.co.jp/web/ja/jp/restaurants/discovery-restaurant",
      "https://www.usj.co.jp/web/ja/jp/restaurants/studio-stars-restaurant",
      "https://www.usj.co.jp/web/ja/jp/restaurants/happiness-cafe",
      "https://www.usj.co.jp/web/ja/jp/restaurants/snoopy-backlot-cafe",
      "https://www.usj.co.jp/web/ja/jp/restaurants/kinopios-cafe",
      "https://www.usj.co.jp/web/ja/jp/restaurants",
      ...restaurantDetailSeeds
    ],
    keyword: /バーガー|ハンバーガー|サンド|sandwich|burger|BLT|チーズバーガー|フィッシュ/i,
    linkPattern: /mels|discovery|studio-stars|happiness|snoopy|kinopios|restaurants|seasonal-food|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 90)
  },
  pasta: {
    sourceName: "official-category-pasta-and-noodles",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/azurra-di-capri",
      "https://www.usj.co.jp/web/ja/jp/restaurants/saido",
      "https://www.usj.co.jp/web/ja/jp/restaurants/the-dragons-pearl",
      "https://www.usj.co.jp/web/ja/jp/restaurants/park-side-grille",
      "https://www.usj.co.jp/web/ja/jp/restaurants",
      ...restaurantDetailSeeds
    ],
    keyword: /パスタ|スパゲ|ヌードル|ラーメン|麺|うどん|pasta|noodle|spaghetti/i,
    linkPattern: /azurra|saido|dragons|park-side|restaurants|seasonal-food|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 90)
  },
  kids: {
    sourceName: "official-category-kids-menus",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants/kinopios-cafe",
      "https://www.usj.co.jp/web/ja/jp/restaurants/studio-stars-restaurant",
      "https://www.usj.co.jp/web/ja/jp/restaurants/snoopy-backlot-cafe",
      "https://www.usj.co.jp/web/ja/jp/restaurants/happiness-cafe",
      "https://www.usj.co.jp/web/ja/jp/restaurants/discovery-restaurant",
      "https://www.usj.co.jp/web/ja/jp/restaurants",
      ...restaurantDetailSeeds
    ],
    keyword: /キッズ|お子さま|おこさま|kids|child|ジュニア|プレート|セット/i,
    linkPattern: /kids|kinopios|studio-stars|snoopy|happiness|discovery|restaurants|seasonal-food|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 90)
  },
  restaurantmenus: {
    sourceName: "official-restaurant-menu-coverage",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants",
      "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
      ...restaurantDetailSeeds
    ],
    keyword: /ピザ|ピッツァ|パスタ|バーガー|サンド|キッズ|お子さま|セット|プレート|カレー|ライス|チキン|ステーキ|ケーキ|ドリンク|デザート|メニュー|円|¥|￥/i,
    linkPattern: /restaurants|seasonal-food|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 140)
  },
  prices: {
    sourceName: "official-and-castel-price-supplement",
    seeds: [
      "https://www.usj.co.jp/web/ja/jp/restaurants",
      "https://www.usj.co.jp/web/ja/jp/restaurants/food-cart",
      "https://www.usj.co.jp/web/ja/jp/restaurants/seasonal-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants/super-nintendo-world-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants/the-wizarding-world-of-harry-potter-food",
      "https://www.usj.co.jp/web/ja/jp/restaurants/minion-food",
      ...restaurantDetailSeeds,
      "https://castel.jp/p/3101"
    ],
    keyword: /(?:¥|￥|\d{2,3}(?:,\d{3})?円|価格|税込|単品|セット|チュリトス|チュロス|ポップコーン|ドリンク|ソーダ|ラテ|ジュース|ケーキ|サンデー|ターキーレッグ|フード|メニュー)/i,
    linkPattern: /restaurants|food-cart|seasonal-food|super-nintendo|wizarding|harry|minion|castel|events|news|food/i,
    maxPages: Number(process.env.CRAWL_MAX_CATEGORY_PAGES ?? 80)
  }
};

export async function crawlTargetedPages(mode: TargetMode = "coverage"): Promise<CrawlSourceResult> {
  const config = targetConfigs[mode] ?? targetConfigs.coverage;
  const visited = new Set<string>();
  const queue = [...config.seeds];
  const foods = [];
  const errors: string[] = [];

  while (queue.length > 0 && visited.size < config.maxPages) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    visited.add(url);
    try {
      let html = "";
      try {
        html = await fetchText(url, { retries: 1, timeoutMs: 15000 });
        const parsedFoods = url.includes("castel.jp/p/3101") ? parseCastelChurros(html, url) : parseFoodsFromHtml(html, url);
        const pageFoods = parsedFoods.filter((food) => config.keyword.test(`${food.name} ${food.description ?? ""} ${food.shopName} ${food.areaName} ${food.sourceUrl}`));
        foods.push(...pageFoods);
      } catch (error) {
        errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
      const tridionUrl = webUrlToTridionUrl(url);
      if (tridionUrl) {
        const tcm = await fetchText(tridionUrl, { retries: 1, timeoutMs: 15000 });
        const parsed = parseFoodsFromTcmJson(tcm, tridionUrl);
        foods.push(...parsed.foods.filter((food) => config.keyword.test(`${food.name} ${food.description ?? ""} ${food.shopName} ${food.areaName} ${food.sourceUrl}`)));
        for (const link of [...parsed.links, ...extractWebLinksFromRaw(tcm)].filter((link) => config.linkPattern.test(link))) {
          if (!visited.has(link) && !queue.includes(link)) queue.push(link);
        }
      }
      if (html) {
        for (const link of extractInternalLinks(html, url).filter((link) => config.linkPattern.test(link))) {
          if (!visited.has(link) && !queue.includes(link)) queue.push(link);
        }
      }
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    sourceName: config.sourceName,
    sourceUrl: config.seeds[0],
    pagesCrawled: visited.size,
    foods,
    errors,
    fetchedUrls: [...visited]
  };
}

export function getTargetModes() {
  return Object.keys(targetConfigs) as TargetMode[];
}

function extractWebLinksFromRaw(raw: string) {
  return raw
    .split(/["\\<>\s]+/)
    .filter((part) => part.startsWith("/usj/ja/jp/") || part.startsWith("/web/ja/jp/") || part.startsWith("/company/news/") || part.startsWith("/food/"))
    .map((part) => {
      try {
        return new URL(part.replace("/usj/ja/jp/", "/web/ja/jp/"), "https://www.usj.co.jp").toString();
      } catch {
        return "";
      }
    })
    .filter((url) => url && !/\.(png|jpe?g|webp|svg|ico)($|\?)/i.test(url));
}
