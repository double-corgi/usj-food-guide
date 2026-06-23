import { readGeneratedCrawlLogs, readGeneratedSummary } from "@/lib/repositories/generated-data";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import type { FoodWithRelations } from "@/types/domain";

export async function getAdminOverview() {
    const foods = await listAllFoodCandidates();
    const shops = Array.from(new Map(foods.map((food) => [food.shop.id, food.shop])).values());
    const areas = Array.from(new Map(foods.map((food) => [food.area.id, food.area])).values());
    const summary = readGeneratedSummary();
    const duplicateImageRows = buildDuplicateImageRows(foods);
    const storefrontRows = buildImageIssueRows(foods, "storefront");
    const shelfRows = buildImageIssueRows(foods, "shelf");
    const lowQualityRows = buildImageIssueRows(foods, "low-quality");
    return {
      counts: {
        foods: foods.length,
        shops: shops.length,
        areas: areas.length,
        images: foods.reduce((sum, food) => sum + food.images.length, 0),
        approved: foods.filter((food) => food.reviewStatus === "approved" && !food.hidden).length,
        pending: foods.filter((food) => food.reviewStatus === "pending").length,
        rejected: foods.filter((food) => food.reviewStatus === "rejected").length,
        hidden: foods.filter((food) => food.hidden).length,
        imageMissing: foods.filter((food) => food.images.length === 0).length,
        duplicates: foods.filter((food) => food.duplicateGroupId).length,
        crawlLogs: readGeneratedCrawlLogs().length,
        highQuality: foods.filter((food) => food.displayQuality === "high" && food.reviewStatus === "approved" && !food.hidden).length,
        mediumQuality: foods.filter((food) => food.displayQuality === "medium").length,
        lowQuality: foods.filter((food) => food.displayQuality === "low").length,
        brokenNames: foods.filter((food) => food.nameQualityScore < 62 || food.rejectionReasons?.some((reason) => ["bad-food-name", "low-name-quality", "html-json-js-fragment"].includes(reason))).length,
        composite: foods.filter((food) => food.compositeMenu || food.rejectionReasons?.includes("composite-menu")).length,
        sharedImages: foods.filter((food) => food.images.some((image) => image.isSharedTooMuch)).length,
        watermarkImages: foods.filter((food) => food.images.some((image) => image.hasWatermark || image.imageMismatchReason?.startsWith("watermark:") || image.imageMismatchReason === "supplemental-watermark-risk")).length,
        officialImages: foods.filter((food) => food.images.some((image) => image.enabled && image.sourceType === "official" && !image.isSharedTooMuch)).length,
        verifiedImages: foods.filter((food) => food.images.some((image) => image.enabled && image.imageVerified)).length,
        imageMismatchExcluded: foods.filter((food) => food.images.some((image) => image.imageMismatchReason && !image.enabled)).length,
        lowQualityImages: lowQualityRows.length,
        storefrontImages: storefrontRows.length,
        shelfImages: shelfRows.length,
        replacementNeeded: foods.filter((food) => food.images.some((image) => image.imageMismatchReason && !image.enabled) && !food.images.some((image) => image.enabled && image.imageVerified)).length,
        canonicalFoods: foods.filter((food) => food.canonicalFood).length
      },
      imageQueues: {
        missing: foods
          .filter((food) => food.canonicalFood && !food.hidden && !food.images.some((image) => image.enabled && image.imageVerified))
          .slice(0, 60)
          .map((food) => ({
            id: food.id,
            name: food.name,
            category: food.category,
            sourceUrl: food.sourceUrl,
            reason: food.images[0]?.imageMismatchReason ?? "no-verified-image",
            imageUrl: food.images[0]?.imageUrl
          })),
        verified: foods
          .filter((food) => food.images.some((image) => image.enabled && image.imageVerified))
          .slice(0, 60)
          .map((food) => ({
            id: food.id,
            name: food.name,
            category: food.category,
            sourceUrl: food.sourceUrl,
            reason: food.images.find((image) => image.enabled && image.imageVerified)?.imageMatchReason ?? "verified",
            imageUrl: food.images.find((image) => image.enabled && image.imageVerified)?.imageUrl
          })),
        mismatch: foods
          .filter((food) => food.images.some((image) => image.imageMismatchReason && !image.enabled))
          .slice(0, 60)
          .map((food) => ({
            id: food.id,
            name: food.name,
            category: food.category,
            sourceUrl: food.sourceUrl,
            reason: food.images.find((image) => image.imageMismatchReason && !image.enabled)?.imageMismatchReason ?? "mismatch",
            imageUrl: food.images.find((image) => image.imageMismatchReason && !image.enabled)?.imageUrl
          })),
        watermark: foods
          .filter((food) => food.images.some((image) => image.hasWatermark || image.imageMismatchReason?.startsWith("watermark:") || image.imageMismatchReason === "supplemental-watermark-risk"))
          .slice(0, 60)
          .map((food) => {
            const image = food.images.find((candidate) => candidate.hasWatermark || candidate.imageMismatchReason?.startsWith("watermark:") || candidate.imageMismatchReason === "supplemental-watermark-risk");
            return {
              id: food.id,
              name: food.name,
              category: food.category,
              sourceUrl: food.sourceUrl,
              reason: image?.watermarkReason ?? image?.imageMismatchReason ?? "watermark-risk",
              imageUrl: image?.imageUrl
            };
          }),
        duplicate: duplicateImageRows.slice(0, 60).map((row) => ({
          id: row.food.id,
          name: row.food.name,
          category: row.food.category,
          sourceUrl: row.food.sourceUrl,
          reason: `same image used by ${row.count} foods`,
          imageUrl: row.imageUrl
          })),
        lowQuality: lowQualityRows.slice(0, 60),
        storefront: storefrontRows.slice(0, 60),
        shelf: shelfRows.slice(0, 60),
        replacementNeeded: foods
          .filter((food) => food.images.some((image) => image.imageMismatchReason && !image.enabled) && !food.images.some((image) => image.enabled && image.imageVerified))
          .slice(0, 60)
          .map((food) => ({
            id: food.id,
            name: food.name,
            category: food.category,
            sourceUrl: food.sourceUrl,
            reason: food.images.find((image) => image.imageMismatchReason && !image.enabled)?.imageMismatchReason ?? "replacement-needed",
            imageUrl: food.images.find((image) => image.imageMismatchReason && !image.enabled)?.imageUrl
          }))
      },
      crawlLogs: readGeneratedCrawlLogs(),
      candidates: foods
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 200)
        .map((food) => ({
          id: food.id,
          name: food.name,
          category: food.category,
          status: food.status,
          confidenceScore: food.confidenceScore,
          nameQualityScore: food.nameQualityScore,
          displayQuality: food.displayQuality,
          reviewStatus: food.reviewStatus,
          hidden: food.hidden,
          duplicateGroupId: food.duplicateGroupId,
          sourceUrl: food.sourceUrl,
          area: food.area.name,
          shop: food.shop.name,
          compositeMenu: food.compositeMenu,
          rejectionReasons: food.rejectionReasons ?? [],
          imageUrl: food.images.find((image) => image.enabled)?.imageUrl ?? food.images[0]?.imageUrl,
          imageConfidenceScore: food.images.find((image) => image.enabled)?.imageConfidenceScore ?? food.images[0]?.imageConfidenceScore ?? 0,
          imageMatchScore: food.images.find((image) => image.enabled)?.imageMatchScore ?? food.images[0]?.imageMatchScore ?? 0,
          categoryImageMatchScore: food.images.find((image) => image.enabled)?.categoryImageMatchScore ?? food.images[0]?.categoryImageMatchScore ?? 0,
          imageVerified: food.images.find((image) => image.enabled)?.imageVerified ?? food.images[0]?.imageVerified ?? false,
          imageMatchReason: food.images.find((image) => image.enabled)?.imageMatchReason ?? food.images[0]?.imageMatchReason,
          imageMismatchReason: food.images.find((image) => !image.enabled && image.imageMismatchReason)?.imageMismatchReason,
          imageSourceContext: food.images.find((image) => image.imageSourceContext)?.imageSourceContext,
          isSharedImage: food.images.some((image) => image.isSharedTooMuch),
          hasWatermark: food.images.some((image) => image.hasWatermark || image.imageMismatchReason?.startsWith("watermark:") || image.imageMismatchReason === "supplemental-watermark-risk"),
          watermarkReason: food.images.find((image) => image.hasWatermark || image.imageMismatchReason?.startsWith("watermark:") || image.imageMismatchReason === "supplemental-watermark-risk")?.watermarkReason
        })),
      summary
    };
}

type AdminFood = FoodWithRelations;

function buildDuplicateImageRows(foods: AdminFood[]) {
  const byImage = new Map<string, AdminFood[]>();
  for (const food of foods) {
    if (food.reviewStatus !== "approved" || food.hidden || food.canonicalFood === false) continue;
    const image = food.images.find((candidate) => candidate.enabled && candidate.sourceType === "official" && candidate.imageVerified && !candidate.imageMismatchReason && !candidate.hasWatermark && candidate.imageUrl);
    if (!image?.imageUrl) continue;
    const current = byImage.get(image.imageUrl) ?? [];
    current.push(food);
    byImage.set(image.imageUrl, current);
  }
  return Array.from(byImage.entries())
    .filter(([, groupedFoods]) => groupedFoods.length > 1)
    .flatMap(([imageUrl, groupedFoods]) =>
      groupedFoods.map((food) => ({
        imageUrl,
        count: groupedFoods.length,
        food
      }))
    )
    .sort((a, b) => b.count - a.count || a.food.name.localeCompare(b.food.name, "ja"));
}

function buildImageIssueRows(foods: AdminFood[], issue: "low-quality" | "storefront" | "shelf") {
  return foods
    .flatMap((food) =>
      food.images
        .filter((image) => isImageIssue(image, issue))
        .map((image) => ({
          id: food.id,
          name: food.name,
          category: food.category,
          sourceUrl: food.sourceUrl,
          reason: image.imageMismatchReason ?? image.watermarkReason ?? issue,
          imageUrl: image.imageUrl
        }))
    )
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

function isImageIssue(image: AdminFood["images"][number], issue: "low-quality" | "storefront" | "shelf") {
  const haystack = `${image.imageUrl} ${image.altText ?? ""} ${image.imageSourceContext ?? ""} ${image.imageMismatchReason ?? ""}`.normalize("NFKC");
  if (issue === "storefront") {
    return /(storefront|shopfront|exterior|entrance|food-cart-in-front|cart-in-front|外観|店頭|カート前|ワゴン|販売場所)/i.test(haystack);
  }
  if (issue === "shelf") {
    return /(shelf|display|showcase|stand|booth|menu-board|signboard|棚|陳列|売り場|看板|メニュー表)/i.test(haystack);
  }
  return /(low-image-product-match|generic-event-or-restaurant-image|non-product|low-quality|ambiguous-tcm-component|supplemental-composite-position-image|supplemental-generic-article-image)/i.test(haystack);
}
