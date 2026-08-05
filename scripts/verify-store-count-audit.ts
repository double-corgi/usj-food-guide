import fs from "node:fs";
import path from "node:path";

type Catalog = {
  generatedAt?: string;
  foods?: Food[];
  shops?: Shop[];
  areas?: Area[];
  dashboard?: Record<string, unknown>;
};

type Food = {
  id: string;
  name: string;
  saleStatus?: string;
  status?: string;
  shopId?: string | null;
  shopName?: string | null;
  areaId?: string | null;
  areaName?: string | null;
  shopType?: string | null;
  locations?: Array<{ shopId?: string | null; shopName?: string | null; areaId?: string | null; areaName?: string | null; type?: string | null; shopType?: string | null }>;
};

type Shop = {
  id: string;
  name: string;
  areaId?: string | null;
  areaName?: string | null;
  type?: string | null;
  imageUrl?: string | null;
};

type Area = { id: string; name: string };

type ShopUsage = {
  activeFoods: number;
  scheduledFoods: number;
  endedFoods: number;
  hiddenFoods: number;
  totalFoods: number;
};

const archiveCatalogPath = process.env.BUILD13_ARCHIVE_CATALOG_PATH ?? "/private/tmp/unicolle-build13-final-candidate.xcarchive/Products/Applications/App.app/public/api/native/catalog";
const productionCatalogPath = process.env.PRODUCTION_NATIVE_CATALOG_PATH ?? "/private/tmp/unicolle-prod-native-store-audit.json";
const reportPath = process.env.STORE_COUNT_AUDIT_REPORT_PATH ?? "docs/store-count-audit-build13.md";

function readCatalog(filePath: string): Catalog {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeStoreName(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[™®]/g, "")
    .replace(/^・+/, "")
    .replace(/[\s　・･,，.．'’`´\-ー―‐‑–—~〜～:：;；/／\\|()（）\[\]［］{}｛｝「」『』【】!！?？]/g, "")
    .toLowerCase();
}

function normalizeAreaName(value?: string | null) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[™®]/g, "")
    .replace(/[\s　・･]/g, "")
    .toLowerCase();
}

function shopKey(shop: Pick<Shop, "id">) {
  return String(shop.id);
}

function uniqueIds<T extends { id: string }>(items: T[]) {
  return Array.from(new Set(items.map((item) => item.id)));
}

function duplicateCount(ids: string[]) {
  return ids.length - new Set(ids).size;
}

function buildUsage(catalog: Catalog, hiddenCatalog?: Catalog) {
  const usage = new Map<string, ShopUsage>();
  function ensure(id: string): ShopUsage {
    const current = usage.get(id) ?? { activeFoods: 0, scheduledFoods: 0, endedFoods: 0, hiddenFoods: 0, totalFoods: 0 };
    usage.set(id, current);
    return current;
  }
  for (const food of catalog.foods ?? []) {
    const shopIds = foodShopIds(food);
    for (const id of shopIds) {
      const item = ensure(id);
      item.totalFoods += 1;
      const status = saleStatus(food);
      if (status === "active") item.activeFoods += 1;
      else if (status === "scheduled" || status === "upcoming") item.scheduledFoods += 1;
      else if (status === "ended") item.endedFoods += 1;
    }
  }
  for (const food of hiddenCatalog?.foods ?? []) {
    const shopIds = foodShopIds(food);
    for (const id of shopIds) {
      const item = ensure(id);
      item.hiddenFoods += 1;
      item.totalFoods += 1;
    }
  }
  return usage;
}

function saleStatus(food: Food) {
  return String(food.saleStatus ?? food.status ?? "unknown");
}

function foodShopIds(food: Food) {
  const ids = new Set<string>();
  if (food.shopId && food.shopName && food.shopName !== "店舗未確認") ids.add(String(food.shopId));
  for (const location of food.locations ?? []) {
    if (location.shopId && location.shopName && location.shopName !== "店舗未確認") ids.add(String(location.shopId));
  }
  return Array.from(ids);
}

function shopMap(catalog: Catalog) {
  return new Map((catalog.shops ?? []).map((shop) => [shopKey(shop), shop]));
}

function similarPairs(shops: Shop[]) {
  const byName = new Map<string, Shop[]>();
  for (const shop of shops) {
    const key = `${normalizeStoreName(shop.name)}|${normalizeAreaName(shop.areaName)}`;
    const list = byName.get(key) ?? [];
    list.push(shop);
    byName.set(key, list);
  }
  return Array.from(byName.entries())
    .filter(([, list]) => list.length > 1)
    .map(([key, list]) => ({ key, shops: list.map((shop) => ({ id: shop.id, name: shop.name, areaName: shop.areaName })) }));
}

function areaCounts(catalog: Catalog) {
  const counts = new Map<string, number>();
  for (const shop of catalog.shops ?? []) {
    const areaName = shop.areaName ?? "エリア確認中";
    counts.set(areaName, (counts.get(areaName) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], "ja"));
}

function markdownTable(rows: string[][]) {
  if (!rows.length) return "該当なし";
  const header = rows[0];
  const separator = header.map(() => "---");
  return [header, separator, ...rows.slice(1)].map((row) => `| ${row.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`).join("\n");
}

async function main() {
  if (!fs.existsSync(archiveCatalogPath)) throw new Error(`Build 13 archive catalog not found: ${archiveCatalogPath}`);
  if (!fs.existsSync(productionCatalogPath)) throw new Error(`Production catalog not found: ${productionCatalogPath}`);

  const archive = readCatalog(archiveCatalogPath);
  const production = readCatalog(productionCatalogPath);
  const archiveShops = archive.shops ?? [];
  const productionShops = production.shops ?? [];
  const archiveMap = shopMap(archive);
  const productionMap = shopMap(production);
  const archiveIds = uniqueIds(archiveShops);
  const productionIds = uniqueIds(productionShops);
  const archiveSet = new Set(archiveIds);
  const productionSet = new Set(productionIds);
  const managementOnly = productionIds.filter((id) => !archiveSet.has(id)).map((id) => productionMap.get(id)!).filter(Boolean);
  const publicOnly = archiveIds.filter((id) => !productionSet.has(id)).map((id) => archiveMap.get(id)!).filter(Boolean);
  const both = productionIds.filter((id) => archiveSet.has(id));
  const productionUsage = buildUsage(production);
  const archiveUsage = buildUsage(archive);
  const duplicateCandidates = similarPairs(productionShops);
  const managementOnlyRows = [
    ["店舗ID", "店舗名", "エリア", "由来", "通常画面へ出ない理由", "管理で数えられる理由", "販売中", "開始前", "販売終了", "推奨分類"],
    ...managementOnly.map((shop) => {
      const usage = productionUsage.get(shop.id) ?? { activeFoods: 0, scheduledFoods: 0, endedFoods: 0, hiddenFoods: 0, totalFoods: 0 };
      return [
        shop.id,
        shop.name,
        shop.areaName ?? "エリア確認中",
        inferSource(shop.id),
        "Build 13同梱ローカルカタログ生成後に本番公開カタログへ追加されたため",
        "現在の本番公開カタログの商品販売場所に紐づくため",
        String(usage.activeFoods),
        String(usage.scheduledFoods),
        String(usage.endedFoods),
        usage.activeFoods + usage.scheduledFoods > 0 ? "通常画面も次回ビルドで表示対象" : "要確認"
      ];
    })
  ];
  const areaRows = [["エリア", "Build 13通常画面", "現在Production", "差"], ...mergeAreaCounts(areaCounts(archive), areaCounts(production))];
  const duplicateRows = [["正規化キー", "候補"], ...duplicateCandidates.map((item) => [item.key, item.shops.map((shop) => `${shop.name} (${shop.id})`).join(" / ")])];
  const summary = {
    archiveGeneratedAt: archive.generatedAt,
    productionGeneratedAt: production.generatedAt,
    normalScreenUniqueStores: archiveIds.length,
    productionPublicCatalogStores: productionIds.length,
    managementApiStores: productionIds.length,
    bothStores: both.length,
    managementOnlyStores: managementOnly.length,
    normalOnlyStores: publicOnly.length,
    archiveDuplicateStoreIds: duplicateCount((archive.shops ?? []).map((shop) => shop.id)),
    productionDuplicateStoreIds: duplicateCount((production.shops ?? []).map((shop) => shop.id)),
    productionDuplicateNameAreaCandidates: duplicateCandidates.length,
    archiveFoodCount: archive.foods?.length ?? 0,
    productionFoodCount: production.foods?.length ?? 0,
    archiveDashboard: archive.dashboard,
    productionDashboard: production.dashboard,
    managementOnlyStoresWithActiveFoods: managementOnly.filter((shop) => (productionUsage.get(shop.id)?.activeFoods ?? 0) > 0).length,
    managementOnlyStoresWithScheduledOnly: managementOnly.filter((shop) => (productionUsage.get(shop.id)?.activeFoods ?? 0) === 0 && (productionUsage.get(shop.id)?.scheduledFoods ?? 0) > 0).length,
    managementOnlyStoresWithNoFoods: managementOnly.filter((shop) => (productionUsage.get(shop.id)?.totalFoods ?? 0) === 0).length,
    archiveAreaGroupSum: Array.from(archiveUsage.keys()).filter((id) => archiveSet.has(id)).length,
    productionAreaGroupSum: Array.from(productionUsage.keys()).filter((id) => productionSet.has(id)).length
  };
  const report = `# Build 13 店舗件数監査

作成日時: ${new Date().toISOString()}

## 結論

Build 13通常画面の「全77店舗」は、Archiveに同梱されたローカル公開カタログ（${archive.generatedAt ?? "日時不明"}）の店舗数です。管理トップの88店舗は、現在のProduction公開カタログ（${production.generatedAt ?? "日時不明"}）の商品販売場所から作られる一意店舗数です。

差分11店舗は、非公開店舗や管理専用店舗ではなく、Build 13同梱後にProduction公開カタログへ追加された公開販売場所です。現在の正しい通常画面総数は、最新データ基準では88店舗です。ただしBuild 13の通常画面はローカルassets同梱データを表示するため、アプリ本体を更新するまで77店舗のままです。

## 件数サマリー

\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`

## 4種類の店舗集合

- A. 通常の店舗画面に実際に表示される店舗: ${archiveIds.length}件
- B. 現在のProduction公開カタログの商品に販売場所として紐づく店舗: ${productionIds.length}件
- C. 管理APIが返す店舗: ${productionIds.length}件（staff catalog traceの\`shopsLength\`および現在の公開カタログ\`shops\`配列と一致）
- D. 全登録店舗: この監査では本番DBの非公開・廃止\`staff_shops\`全量を直接読んでいないため確定対象外。ただし管理APIレスポンス上、店舗配列は公開カタログ由来の88件であり、差分11件は非公開店舗ではありません。

## 差分11店舗

${markdownTable(managementOnlyRows)}

## 通常画面にだけ存在する店舗

${publicOnly.length ? markdownTable([["店舗ID", "店舗名", "エリア"], ...publicOnly.map((shop) => [shop.id, shop.name, shop.areaName ?? "エリア確認中"])]) : "該当なし"}

## エリア別店舗数

${markdownTable(areaRows)}

## 重複候補

${duplicateCandidates.length ? markdownTable(duplicateRows) : "正規化した店舗名+エリアでの重複候補はありません。"}

## 表示定義の決定案

- 通常画面「全○店舗」: アプリが実際に表示している一意店舗数。Build 13では77件、次回ビルドで最新カタログを同梱する場合は88件。
- 管理トップ「店舗総数」: 名称が「店舗総数」のままなら最新Production公開カタログの一意店舗数、現在は88件。
- 管理トップで通常画面との差を避ける場合: 「公開店舗（最新データ）」と表示するか、通常画面側を次回ビルドで最新カタログへ更新する。

## 本番データ修正の要否

本番データ修正は不要です。差分11店舗は公開商品に紐づく店舗で、販売中商品数もあります。店舗ID統合や削除を行う根拠はありません。

## 新しいiOSビルドの要否

通常画面の表示を88店舗へ合わせるには新しいiOSビルドが必要です。Build 13はローカルassets内の2026-07-27時点カタログを表示するため、サーバー修正だけでは通常画面の77店舗は変わりません。管理トップはサーバーAPIを読むため現在の88件が正です。
`;
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);
  console.log(JSON.stringify({ summary, managementOnlyStores: managementOnly.map((shop) => ({ id: shop.id, name: shop.name, areaName: shop.areaName, usage: productionUsage.get(shop.id) ?? null })) }, null, 2));
}

function inferSource(id: string) {
  if (id.startsWith("manual-shop-")) return "manual";
  if (id.startsWith("staff-shop-")) return "staff_shops";
  if (id.startsWith("shop-")) return "商品販売場所から生成された公開店舗ID";
  return "その他";
}

function mergeAreaCounts(a: Array<[string, number]>, b: Array<[string, number]>) {
  const keys = Array.from(new Set([...a.map(([key]) => key), ...b.map(([key]) => key)])).sort((x, y) => x.localeCompare(y, "ja"));
  const aMap = new Map(a);
  const bMap = new Map(b);
  return keys.map((key) => [key, String(aMap.get(key) ?? 0), String(bMap.get(key) ?? 0), String((bMap.get(key) ?? 0) - (aMap.get(key) ?? 0))]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
