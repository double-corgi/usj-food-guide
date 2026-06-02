"use client";

import { isEaten } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import { useMemo } from "react";

export function HomeHeaderStats({
  foodIds,
  total,
  archiveFoodIds,
  archiveTotal
}: {
  foodIds: string[];
  total: number;
  archiveFoodIds?: string[];
  archiveTotal?: number;
}) {
  const { logs } = useFoodLogs();
  const eatenCount = useMemo(() => foodIds.filter((id) => isEaten(logs, id)).length, [foodIds, logs]);
  const completionRate = total ? Math.round((eatenCount / total) * 100) : 0;
  const archiveEatenCount = useMemo(() => (archiveFoodIds ?? []).filter((id) => isEaten(logs, id)).length, [archiveFoodIds, logs]);
  const archiveRate = archiveTotal ? Math.round((archiveEatenCount / archiveTotal) * 100) : 0;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <StatusMini label="現在販売中" value={`${eatenCount}/${total}`} />
      <StatusMini label="現在販売中コンプ率" value={`${completionRate}%`} />
      <StatusMini label="図鑑コンプ率" value={`${archiveRate}%`} />
    </div>
  );
}

export function HomeProgressStatusClient({ foodIds, total, archiveTotal }: { foodIds: string[]; total: number; archiveTotal?: number }) {
  const { logs } = useFoodLogs();
  const eatenCount = useMemo(() => foodIds.filter((id) => isEaten(logs, id)).length, [foodIds, logs]);
  const completionRate = total ? Math.round((eatenCount / total) * 100) : 0;
  const remainingCount = Math.max(total - eatenCount, 0);

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_10px_28px_rgba(31,41,55,0.06)]">
      <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StatusMini label="販売中GET" value={`${eatenCount}/${total}件`} />
        <StatusMini label="現在コンプ" value={`${completionRate}%`} />
        <StatusMini label="残り" value={`${remainingCount}件`} />
        {archiveTotal ? <StatusMini label="図鑑総数" value={`${archiveTotal}件`} /> : null}
      </div>
    </section>
  );
}

function StatusMini({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-w-[132px] shrink-0 items-center justify-between gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
      {label}
      <strong className="text-ink">{value}</strong>
    </span>
  );
}
