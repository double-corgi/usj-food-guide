import { convertToKRW, convertToTWD } from "@/lib/currency-rates";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

type PriceInput = {
  price?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
};

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

export function formatPriceI18n(food: PriceInput, locale: Locale, t: TFn): string {
  const min = food.priceMin ?? food.price;
  const max = food.priceMax ?? food.price;
  if (typeof min !== "number") return t("foods.priceUnknown");

  const rangeMax = typeof max === "number" && max !== min ? max : null;
  const primaryMin = formatJpy(min);
  const primaryMax = rangeMax === null ? null : formatJpy(rangeMax);
  const jpySeparator = locale === "ja" ? "〜" : " – ";
  const primary = primaryMax ? `${primaryMin}${jpySeparator}${primaryMax}` : primaryMin;

  if (locale === "ko") {
    const supplement = rangeMax === null
      ? `약 ₩${convertToKRW(min).toLocaleString("ko-KR")}`
      : `약 ₩${convertToKRW(min).toLocaleString("ko-KR")}–₩${convertToKRW(rangeMax).toLocaleString("ko-KR")}`;
    return `${primary}（${supplement}）`;
  }

  if (locale === "zh-TW") {
    const supplement = rangeMax === null
      ? `約 NT$${convertToTWD(min).toLocaleString("zh-TW")}`
      : `約 NT$${convertToTWD(min).toLocaleString("zh-TW")}–NT$${convertToTWD(rangeMax).toLocaleString("zh-TW")}`;
    return `${primary}（${supplement}）`;
  }

  return primary;
}

function formatJpy(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}
