import { createClient } from "@supabase/supabase-js";
import { areas, foodImages, foods, shops } from "../lib/sample-data";
import type { Database } from "../types/database";
import { loadEnvFiles } from "./utils/load-env";

loadEnvFiles();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  for (const area of areas) {
    await supabase.from("areas").upsert({ id: area.id, name: area.name, sort_order: area.sortOrder }, { onConflict: "name" });
  }
  for (const shop of shops) {
    await supabase.from("shops").upsert(
      {
        id: shop.id,
        area_id: shop.areaId,
        name: shop.name,
        type: shop.type,
        official_url: shop.officialUrl ?? null,
        is_active: shop.isActive
      },
      { onConflict: "area_id,name" }
    );
  }
  for (const food of foods) {
    await supabase.from("foods").upsert(
      {
        id: food.id,
        shop_id: food.shopId,
        area_id: food.areaId,
        name: food.name,
        normalized_name: food.normalizedName,
        category: food.category,
        price: food.price ?? null,
        description: food.description ?? null,
        official_url: food.officialUrl ?? null,
        source_url: food.sourceUrl,
        start_date: food.startDate ?? null,
        end_date: food.endDate ?? null,
        status: food.status,
        is_limited: food.isLimited,
        last_checked_at: food.lastCheckedAt
      },
      { onConflict: "shop_id,normalized_name" }
    );
  }
  for (const [index, image] of foodImages.entries()) {
    await supabase.from("food_images").upsert(
      {
        id: image.id,
        food_id: image.foodId,
        image_url: image.imageUrl,
        source_type: image.sourceType,
        source_url: image.sourceUrl ?? null,
        priority: image.priority ?? index + 100,
        alt_text: image.altText ?? null,
        enabled: image.enabled
      },
      { onConflict: "food_id,image_url" }
    );
  }
  console.log(`Seeded ${foods.length} foods.`);
}

void main();
