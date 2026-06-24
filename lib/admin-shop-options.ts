import { adminAreaOptions } from "@/lib/admin-food-ui";
import { inferAreaFromText, normalizeDisplayAreaName } from "@/lib/food-utils";
import { readGeneratedAreas, readGeneratedShops } from "@/lib/repositories/generated-data";
import type { AdminShopOption } from "@/components/admin/food-form";
import type { FoodWithRelations, ShopType } from "@/types/domain";

const adminAreaSet = new Set<string>(adminAreaOptions);

export function buildAdminShopOptions(foods: FoodWithRelations[]): AdminShopOption[] {
  const areaById = new Map(readGeneratedAreas().map((area) => [area.id, area.name]));
  const options = new Map<string, AdminShopOption>();

  for (const shop of readGeneratedShops()) {
    if (!shop.isActive || !shop.name) continue;
    addShopOption(options, {
      name: shop.name,
      areaName: normalizeAdminArea(areaById.get(shop.areaId), shop.name),
      type: inferAdminShopType(shop.name, shop.type)
    });
  }

  for (const food of foods) {
    addShopOption(options, {
      name: food.shop.name,
      areaName: normalizeAdminArea(food.area.name ?? areaById.get(food.shop.areaId), `${food.shop.name} ${food.name}`),
      type: inferAdminShopType(food.shop.name, food.shop.type)
    });

    for (const location of food.locations ?? []) {
      addShopOption(options, {
        name: location.shopName,
        areaName: normalizeAdminArea(location.areaName ?? (location.areaId ? areaById.get(location.areaId) : null), `${location.shopName} ${food.name} ${location.sourceUrl ?? ""}`),
        type: inferAdminShopType(location.shopName, location.shopType)
      });
    }
  }

  return Array.from(options.values()).sort((a, b) => a.name.localeCompare(b.name, "ja") || a.areaName.localeCompare(b.areaName, "ja") || a.type.localeCompare(b.type));
}

function addShopOption(options: Map<string, AdminShopOption>, option: AdminShopOption) {
  const name = option.name.trim();
  if (!name || name === "店舗未確認") return;
  const normalized = { ...option, name };
  options.set(`${normalized.areaName}:${normalized.type}:${normalized.name}`, normalized);
}

function normalizeAdminArea(value: string | null | undefined, context: string) {
  const direct = normalizeDisplayAreaName(value);
  if (direct && adminAreaSet.has(direct)) return direct;

  const inferredFromDirect = normalizeAreaAlias(direct);
  if (inferredFromDirect) return inferredFromDirect;

  const inferred = inferAreaFromText(`${direct ?? ""} ${context}`);
  if (inferred && adminAreaSet.has(inferred)) return inferred;

  const inferredFromContext = normalizeAreaAlias(context);
  if (inferredFromContext) return inferredFromContext;

  return "不明";
}

function normalizeAreaAlias(value?: string | null) {
  if (!value) return null;
  if (/スーパー.*ニンテンドー|ニンテンドー/.test(value)) return "スーパー・ニンテンドー・ワールド";
  if (/ハリー|ポッター|ウィザーディング/.test(value)) return "ウィザーディング・ワールド・オブ・ハリー・ポッター";
  if (/ミニオン/.test(value)) return "ミニオン・パーク";
  if (/ジュラシック/.test(value)) return "ジュラシック・パーク";
  if (/ハリウッド/.test(value)) return "ハリウッド・エリア";
  if (/ニューヨーク|NY|N\.Y\./i.test(value)) return "ニューヨーク・エリア";
  if (/サンフランシスコ/.test(value)) return "サンフランシスコ・エリア";
  if (/アミティ/.test(value)) return "アミティ・ビレッジ";
  if (/ワンダーランド/.test(value)) return "ユニバーサル・ワンダーランド";
  if (/パーク全体/.test(value)) return "パーク全体";
  return null;
}

function inferAdminShopType(name: string, type: ShopType): ShopType {
  if (type !== "unknown") return type;
  if (/ワゴン/.test(name)) return "wagon";
  if (/フードカート|カート|ポップコーンカート/.test(name)) return "cart";
  return "restaurant";
}
