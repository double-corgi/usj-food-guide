import type { MetadataRoute } from "next";
import { listFoods } from "@/lib/repositories/foods";
import { readGeneratedAreas } from "@/lib/repositories/generated-data";
import { buildStoresFromFoods } from "@/lib/store-utils";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const staticRoutes = [
  "/",
  "/foods",
  "/areas",
  "/stores",
  "/eaten",
  "/request",
  "/about",
  "/privacy",
  "/terms",
  "/contact",
  "/disclaimer",
  "/security",
  "/commercial-disclosure"
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const foods = await listFoods();
  const areas = readGeneratedAreas();
  const stores = buildStoresFromFoods(foods);

  return [
    ...staticRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "/" || path === "/foods" ? "daily" as const : "monthly" as const,
      priority: path === "/" ? 1 : 0.7
    })),
    ...foods.map((food) => ({
      url: `${siteUrl}/foods/${food.id}`,
      lastModified: food.lastCheckedAt ? new Date(food.lastCheckedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6
    })),
    ...areas.map((area) => ({
      url: `${siteUrl}/areas/${area.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65
    })),
    ...stores.map((store) => ({
      url: `${siteUrl}/stores/${store.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6
    }))
  ];
}
