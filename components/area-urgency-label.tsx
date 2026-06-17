"use client";

import { getUrgencyLabelI18n } from "@/lib/i18n/sale-label-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import type { FoodStatus, SaleStatus } from "@/types/domain";

type AreaUrgencyFood = {
  saleEndDate?: string | null;
  endDate?: string | null;
  remainingDays?: number | null;
  saleStatus?: SaleStatus;
  status: FoodStatus;
  saleStartDate?: string | null;
  startDate?: string | null;
};

export function AreaUrgencyLabel({ food }: { food: AreaUrgencyFood }) {
  const { t } = useLocale();
  const label = getUrgencyLabelI18n(
    {
      ...food,
      saleEndDate: food.saleEndDate ?? undefined,
      endDate: food.endDate ?? undefined,
      saleStartDate: food.saleStartDate ?? undefined,
      startDate: food.startDate ?? undefined
    },
    t
  );
  if (!label) return null;
  return <p className="mt-1 text-[11px] font-bold text-slate-500">{label}</p>;
}
