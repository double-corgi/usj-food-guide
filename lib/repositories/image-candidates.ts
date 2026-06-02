import { readGeneratedFoods, readGeneratedImageCandidateReport, readGeneratedImageCandidates } from "@/lib/repositories/generated-data";
import { getFoodImage } from "@/lib/utils/image";

export function getImageCandidateOverview() {
  const foods = readGeneratedFoods({ includeHidden: true });
  const candidates = readGeneratedImageCandidates();
  const report = readGeneratedImageCandidateReport();
  const foodById = new Map(foods.map((food) => [food.id, food]));
  const visibleFoods = foods.filter(
    (food) =>
      food.reviewStatus === "approved" &&
      food.canonicalFood !== false &&
      !food.hidden &&
      food.displayQuality !== "low" &&
      food.nameQualityScore >= 60 &&
      food.confidenceScore >= 45 &&
      !food.compositeMenu &&
      Boolean(food.sourceUrl)
  );
  const placeholderFoods = visibleFoods.filter((food) => getFoodImage(food).startsWith("/placeholders/"));
  const enrichedCandidates = candidates.map((candidate) => ({
    ...candidate,
    food: foodById.get(candidate.foodId)
  }));
  return {
    visibleFoods,
    placeholderFoods,
    candidates: enrichedCandidates,
    counts: {
      placeholders: placeholderFoods.length,
      candidates: candidates.length,
      approved: candidates.filter((candidate) => candidate.isApproved).length,
      rejected: candidates.filter((candidate) => candidate.isRejected).length,
      watermark: candidates.filter((candidate) => candidate.hasWatermark).length,
      publicEligible: candidates.filter(
        (candidate) =>
          candidate.isApproved &&
          !candidate.hasWatermark &&
          candidate.imageMatchScore >= 90 &&
          candidate.isProductPhoto &&
          !candidate.isStorefront &&
          !candidate.isMenuBoard &&
          !candidate.isCollage &&
          !candidate.isCharacterOnly
      ).length
    },
    report,
    bySource: candidates.reduce<Record<string, number>>((counts, candidate) => {
      const key = candidate.sourceDomain ?? "unknown";
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {})
  };
}
