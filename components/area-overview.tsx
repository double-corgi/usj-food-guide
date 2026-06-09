"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { calculateAreaProgress } from "@/lib/area-progress";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { Area, FoodWithRelations } from "@/types/domain";

const officialImageBase = "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images";

const allowedAreas = [
  {
    name: "スーパー・ニンテンドー・ワールド",
    image: `${officialImageBase}/usj-gds-super-nintendo-world-5th-cf6-a.jpg`,
  },
  {
    name: "ウィザーディング・ワールド・オブ・ハリー・ポッター",
    image: `${officialImageBase}/usj-gds-the-wizarding-world-of-harry-potter-cf6-a.jpg`,
  },
  {
    name: "ミニオン・パーク",
    image: `${officialImageBase}/usj-gds-minion-park-cf6-a.jpg`,
  },
  {
    name: "ユニバーサル・ワンダーランド",
    image: `${officialImageBase}/usj-gds-universal-wonderland-cf6-a.jpg`,
  },
  {
    name: "ハリウッド・エリア",
    image: `${officialImageBase}/usj-gds-hollywood-cf6-a.jpg`,
  },
  {
    name: "ニューヨーク・エリア",
    image: `${officialImageBase}/usj-gds-new-york-cf6-a.jpg`,
  },
  {
    name: "サンフランシスコ・エリア",
    image: `${officialImageBase}/usj-gds-san-francisco-cf6-a.jpg`,
  },
  {
    name: "ジュラシック・パーク",
    image: `${officialImageBase}/usj-gds-jurassic-park-the-ride-cf6-a.jpg`,
  },
  {
    name: "アミティ・ビレッジ",
    image: `${officialImageBase}/usj-gds-amity-village-cf6-a.jpg`,
  },
  {
    name: "ウォーターワールド",
    image: `${officialImageBase}/usj-gds-waterworld-cf6-a.jpg`,
  },
];

function normalizeAreaName(name?: string | null) {
  const normalized = (name ?? "")
    .replace(/[™®]/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) return "";
  if (normalized.includes("ニンテンドー")) return "スーパー・ニンテンドー・ワールド";
  if (normalized.includes("ハリー") || normalized.includes("ウィザーディング")) return "ウィザーディング・ワールド・オブ・ハリー・ポッター";
  if (normalized.includes("ミニオン")) return "ミニオン・パーク";
  if (normalized.includes("ワンダーランド")) return "ユニバーサル・ワンダーランド";
  if (normalized.includes("ハリウッド")) return "ハリウッド・エリア";
  if (normalized.includes("ニューヨーク")) return "ニューヨーク・エリア";
  if (normalized.includes("サンフランシスコ")) return "サンフランシスコ・エリア";
  if (normalized.includes("ジュラシック")) return "ジュラシック・パーク";
  if (normalized.includes("アミティ")) return "アミティ・ビレッジ";
  if (normalized.includes("ウォーターワールド")) return "ウォーターワールド";
  return "";
}

export function AreaOverview({ areas, foods }: { areas: Area[]; foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const visibleAreas = allowedAreas.map((definition) => {
    const matched = areas.find((area) => normalizeAreaName(area.name) === definition.name);
    return {
      ...definition,
      id: matched?.id ?? definition.name,
    };
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {visibleAreas.map((area) => {
        const completion = calculateAreaProgress(foods, logs, { id: area.id, name: area.name, sortOrder: 0 }).active;
        const href = areas.some((sourceArea) => sourceArea.id === area.id) ? `/areas/${area.id}` : "/areas";

        return (
          <Link key={area.name} href={href} className="group block overflow-hidden rounded-[1.55rem] bg-white transition active:scale-[0.99] md:hover:-translate-y-0.5">
            <div className="relative h-[230px] overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={area.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,0.05)_0%,rgba(2,8,23,0.3)_38%,rgba(2,8,23,0.86)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 text-mint" size={18} aria-hidden />
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 text-xl font-black leading-tight">{area.name}</h2>
                    <p className="mt-2 text-xs font-black text-white/80">残り {completion.uneaten}品 / コンプ率 {completion.rate}%</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/25">
                      <div className="h-full rounded-full bg-mint" style={{ width: `${completion.rate}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
