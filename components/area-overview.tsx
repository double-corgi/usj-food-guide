"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { getFoodValueScore } from "@/lib/food-value-score";
import { calculateCompletion, isCompletableFood } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { Area, FoodWithRelations } from "@/types/domain";

const officialImageBase = "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images";

const allowedAreas = [
  {
    name: "スーパー・ニンテンドー・ワールド",
    image: `${officialImageBase}/usj-gds-super-nintendo-world-5th-cf6-a.jpg`,
    description: "マリオの世界を歩きながら、限定スナックやカフェメニューを選びやすいエリア。",
  },
  {
    name: "ウィザーディング・ワールド・オブ・ハリー・ポッター",
    image: `${officialImageBase}/usj-gds-the-wizarding-world-of-harry-potter-cf6-a.jpg`,
    description: "魔法界の街並みで、バタービールや英国風フードを楽しむ定番エリア。",
  },
  {
    name: "ミニオン・パーク",
    image: `${officialImageBase}/usj-gds-minion-park-cf6-a.jpg`,
    description: "ポップな見た目のスイーツやドリンクを集めたくなる、にぎやかなエリア。",
  },
  {
    name: "ユニバーサル・ワンダーランド",
    image: `${officialImageBase}/usj-gds-universal-wonderland-cf6-a.jpg`,
    description: "キッズ向けメニューやかわいいスイーツを探しやすいファミリーエリア。",
  },
  {
    name: "ハリウッド・エリア",
    image: `${officialImageBase}/usj-gds-hollywood-cf6-a.jpg`,
    description: "入園直後に寄りやすく、レストランメニューも食べ歩きも選べる中心エリア。",
  },
  {
    name: "ニューヨーク・エリア",
    image: `${officialImageBase}/usj-gds-new-york-cf6-a.jpg`,
    description: "街歩き気分で、レストラン限定フードやドリンクを巡れるエリア。",
  },
  {
    name: "サンフランシスコ・エリア",
    image: `${officialImageBase}/usj-gds-san-francisco-cf6-a.jpg`,
    description: "湾岸の雰囲気に合わせて、カフェ系やボリュームメニューを選びたいエリア。",
  },
  {
    name: "ジュラシック・パーク",
    image: `${officialImageBase}/usj-gds-jurassic-park-the-ride-cf6-a.jpg`,
    description: "豪快なフードや肉系メニューを楽しみたくなる、冒険感のあるエリア。",
  },
  {
    name: "アミティ・ビレッジ",
    image: `${officialImageBase}/usj-gds-amity-village-cf6-a.jpg`,
    description: "海辺の村の雰囲気で、軽食やドリンクを気軽にチェックできるエリア。",
  },
  {
    name: "ウォーターワールド",
    image: `${officialImageBase}/usj-gds-waterworld-cf6-a.jpg`,
    description: "ショー前後に立ち寄る候補を確認しておきたいエリア。",
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
        const areaFoods = foods.filter((food) => {
          const foodAreaName = normalizeAreaName(food.area?.name);
          return (
            food.areaId === area.id ||
            foodAreaName === area.name ||
            food.locations?.some((location) => location.areaId === area.id || normalizeAreaName(location.areaName) === area.name)
          );
        });
        const completion = calculateCompletion(areaFoods, logs);
        const uneaten = Math.max(completion.total - completion.eaten, 0);
        const limitedCount = areaFoods.filter((food) => food.isLimited || food.endDate).length;
        const activeCount = areaFoods.filter(isCompletableFood).length;
        const rankedFoods = [...areaFoods]
          .sort((a, b) => getFoodValueScore(b, foods).total - getFoodValueScore(a, foods).total || a.name.localeCompare(b.name, "ja"))
          .slice(0, 3);
        const averageScore = areaFoods.length
          ? Math.round(areaFoods.reduce((sum, food) => sum + getFoodValueScore(food, foods).total, 0) / areaFoods.length)
          : 0;
        const href = areas.some((sourceArea) => sourceArea.id === area.id) ? `/areas/${area.id}` : "/areas";

        return (
          <Link key={area.name} href={href} className="group block overflow-hidden rounded-[1.55rem] border border-white/80 bg-white p-2.5 shadow-[0_18px_48px_rgba(15,23,42,0.10)] transition active:scale-[0.99] md:hover:-translate-y-0.5 md:hover:border-park">
            <div className="relative h-[220px] overflow-hidden rounded-[1.25rem] bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={area.image}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/88 via-ink/24 to-transparent" />
              <div className="absolute right-3 top-3 rounded-full bg-white/92 px-3 py-1.5 text-sm font-black text-park shadow-sm">
                コンプ率 {completion.rate}%
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="flex items-center gap-2">
                  <MapPin className="text-mint" size={19} aria-hidden />
                  <h2 className="line-clamp-2 text-xl font-black leading-tight">{area.name}</h2>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <OverlayStat label="販売中" value={activeCount} />
                  <OverlayStat label="限定" value={limitedCount} />
                  <OverlayStat label="平均攻略" value={averageScore} suffix="点" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-berry">人気TOP3</p>
                <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500">
                  {rankedFoods.length > 0 ? rankedFoods.map((food) => food.name).join(" / ") : area.description}
                </p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">
                  {uneaten === 0 ? "コンプ完了" : `未食${uneaten}件`} / コンプ率{completion.rate}%
                </p>
              </div>
              <ArrowRight className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-park" size={20} aria-hidden />
            </div>
            <div className="mx-2 mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-park" style={{ width: `${completion.rate}%` }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function OverlayStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-2xl bg-white/14 p-2 text-center ring-1 ring-white/18 backdrop-blur">
      <p className="text-2xl font-black leading-none">{value}{suffix}</p>
      <p className="mt-1 text-[10px] font-black text-white/70">{label}</p>
    </div>
  );
}
