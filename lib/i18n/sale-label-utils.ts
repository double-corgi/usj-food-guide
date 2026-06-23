import {
  getRemainingDays,
  getSaleEndDate,
  getSalePeriodLabel,
  getSaleStartDate,
  getSaleStatus
} from "@/lib/food-utils";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { formatDateShortI18n } from "@/lib/i18n/format-date";
import type { Locale } from "@/lib/i18n/locales";
import type { FoodWithRelations, SaleStatus } from "@/types/domain";

type PeriodFood = Pick<
  FoodWithRelations,
  "saleStatus" | "salePeriodLabel" | "status" | "saleStartDate" | "saleEndDate" | "startDate" | "endDate"
>;

type UrgencyFood = Pick<
  FoodWithRelations,
  "saleEndDate" | "endDate" | "remainingDays" | "saleStatus" | "status" | "saleStartDate" | "startDate"
>;

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

export function getUrgencyLabelI18n(food: UrgencyFood, t: TFn): string | null {
  const remainingDays = getRemainingDays(food);
  if (typeof remainingDays !== "number") return null;
  if (getSaleStatus(food) === "ended") return t("common.ended");
  if (remainingDays <= 14) return t("urgency.endingSoonDays", { count: remainingDays });
  if (remainingDays <= 30) return t("foods.saleFilterEndingSoon");
  return t("urgency.daysRemaining", { count: remainingDays });
}

export function getSaleStatusLabelI18n(food: Parameters<typeof getSaleStatus>[0], t: TFn): string {
  const status = getSaleStatus(food);
  const keyMap: Record<SaleStatus, TranslationKey> = {
    active: "common.saleActive",
    paused: "foods.saleFilterUnknown",
    ended: "common.ended",
    upcoming: "foods.saleFilterUpcoming",
    unknown: "foods.saleFilterUnknown"
  };
  return t(keyMap[status]);
}

export function getSalePeriodLabelI18n(food: PeriodFood, locale: Locale, t: TFn): string {
  if (locale === "ja") return getSalePeriodLabel(food);

  const start = getSaleStartDate(food);
  const end = getSaleEndDate(food);
  const status = getSaleStatus(food);
  const startLabel = formatDateShortI18n(start, locale);
  const endLabel = formatDateShortI18n(end, locale);

  if (startLabel && endLabel) return t("salePeriod.dateRange", { start: startLabel, end: endLabel });
  if (startLabel && status === "upcoming") return t("salePeriod.upcomingFrom", { start: startLabel });
  if (startLabel) return t("salePeriod.openEndFrom", { start: startLabel });
  if (status === "active") return t("common.saleActive");
  if (status === "ended") return t("common.ended");
  return t("foods.saleFilterUnknown");
}
