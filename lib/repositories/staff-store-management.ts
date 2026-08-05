import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { FoodStatus, FoodWithRelations, ShopType } from "@/types/domain";

type StaffShopRow = {
  id: string;
  name: string;
  area_id: string | null;
  area_name: string;
  shop_type: ShopType;
  public_state: "draft" | "published";
  business_status: "active" | "paused" | "ended" | "unknown";
  hidden: boolean;
  deleted_at: string | null;
  official_url: string | null;
};

type StaffFoodStoreLinkRow = {
  id: string;
  food_id: string;
  shop_id: string;
  is_primary: boolean;
  sale_status: "active" | "paused" | "ended" | "unknown";
  price: number | null;
  start_date: string | null;
  end_date: string | null;
  deleted_at: string | null;
};

export type StaffStoreManagementData = {
  shops: StaffShopRow[];
  links: StaffFoodStoreLinkRow[];
};

export async function listStaffStoreManagement(options: { publicOnly?: boolean } = {}): Promise<StaffStoreManagementData> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return { shops: [], links: [] };
  const db = supabase as any;
  let shopsQuery = db.from("staff_shops").select("id,name,area_id,area_name,shop_type,public_state,business_status,hidden,deleted_at,official_url");
  if (options.publicOnly !== false) {
    shopsQuery = shopsQuery.eq("public_state", "published").eq("hidden", false).is("deleted_at", null);
  }
  let linksQuery = db.from("staff_food_store_links").select("id,food_id,shop_id,is_primary,sale_status,price,start_date,end_date,deleted_at");
  if (options.publicOnly !== false) linksQuery = linksQuery.is("deleted_at", null);

  const [shopsResult, linksResult] = await Promise.all([shopsQuery, linksQuery]);
  if (shopsResult.error || linksResult.error) {
    console.warn("Staff store management tables unavailable; continuing without staff store links", {
      shops: shopsResult.error?.message,
      links: linksResult.error?.message
    });
    return { shops: [], links: [] };
  }
  return { shops: shopsResult.data ?? [], links: linksResult.data ?? [] };
}

export function applyStaffStoreManagement(foods: FoodWithRelations[], data: StaffStoreManagementData): FoodWithRelations[] {
  if (data.shops.length === 0 || data.links.length === 0) return foods;
  const shopById = new Map(data.shops.map((shop) => [shop.id, shop]));
  const linksByFoodId = new Map<string, StaffFoodStoreLinkRow[]>();
  for (const link of data.links) {
    if (link.deleted_at || !shopById.has(link.shop_id)) continue;
    const current = linksByFoodId.get(link.food_id) ?? [];
    current.push(link);
    linksByFoodId.set(link.food_id, current);
  }
  return foods.map((food) => {
    const links = linksByFoodId.get(food.id);
    if (!links?.length) return food;
    const primary = links.find((link) => link.is_primary) ?? links[0];
    const primaryShop = shopById.get(primary.shop_id);
    if (!primaryShop) return food;
    const primaryStatus = saleStatusToFoodStatus(primary.sale_status);
    return {
      ...food,
      shopId: primaryShop.id,
      areaId: primaryShop.area_id ?? food.areaId,
      price: primary.price ?? food.price,
      saleStatus: primary.sale_status === "unknown" ? food.saleStatus : primary.sale_status,
      status: primaryStatus === "unknown" ? food.status : primaryStatus,
      startDate: primary.start_date ?? food.startDate,
      endDate: primary.end_date ?? food.endDate,
      saleStartDate: primary.start_date ?? food.saleStartDate,
      saleEndDate: primary.end_date ?? food.saleEndDate,
      area: {
        ...food.area,
        id: primaryShop.area_id ?? food.area.id,
        name: primaryShop.area_name
      },
      shop: {
        ...food.shop,
        id: primaryShop.id,
        areaId: primaryShop.area_id ?? food.area.id,
        name: primaryShop.name,
        type: primaryShop.shop_type,
        officialUrl: primaryShop.official_url ?? food.shop.officialUrl,
        isActive: primaryShop.business_status === "active"
      },
      locations: links.map((link) => {
        const shop = shopById.get(link.shop_id)!;
        const status = saleStatusToFoodStatus(link.sale_status);
        return {
          id: link.id,
          foodId: food.id,
          shopId: shop.id,
          shopName: shop.name,
          areaId: shop.area_id ?? food.area.id,
          areaName: shop.area_name,
          shopType: shop.shop_type,
          sourceUrl: food.sourceUrl,
          price: link.price ?? food.price,
          status: status === "unknown" ? food.status : status,
          startDate: link.start_date ?? undefined,
          endDate: link.end_date ?? undefined,
          lastCheckedAt: food.updatedAt ?? food.lastCheckedAt
        };
      })
    };
  });
}

function saleStatusToFoodStatus(value: string): FoodStatus {
  if (value === "active") return "active";
  if (value === "paused") return "inactive";
  if (value === "ended") return "ended";
  return "unknown";
}
