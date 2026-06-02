import Link from "next/link";
import { FoodImage } from "@/components/food-image";
import { HomeHeaderStats } from "@/components/home-progress-client";
import { rankFoodsByStrategy, strategyStarHighlights, valueReason, type FoodStrategy } from "@/lib/food-value-score";
import { formatFoodPrice, getRemainingDays, isCompletableFood, isEndingSoon } from "@/lib/food-utils";
import type { Area, FoodWithRelations } from "@/types/domain";

type HomeDashboardProps = {
  foods: FoodWithRelations[];
  areas?: Area[];
  generatedAt?: string | null;
};

const categoryChips = [
  { label: "すべて", icon: "🌈", href: "/foods", categories: null },
  { label: "チュリトス", icon: "🌯", href: "/foods?category=churro", categories: ["churro"] },
  { label: "ポップコーン", icon: "🍿", href: "/foods?category=popcorn", categories: ["popcorn"] },
  { label: "ドリンク", icon: "🥤", href: "/foods?category=drink", categories: ["drink"] },
  { label: "ピザ", icon: "🍕", href: "/foods?category=pizza", categories: ["pizza"] },
  { label: "バーガー", icon: "🍔", href: "/foods?category=burger", categories: ["burger"] },
  { label: "パスタ", icon: "🍝", href: "/foods?category=noodle", categories: ["noodle"] },
  { label: "スイーツ", icon: "🍰", href: "/foods?category=sweets", categories: ["dessert"] },
  { label: "キッズ", icon: "🧒", href: "/foods?category=kids", categories: ["kids"] },
  { label: "プレート", icon: "🍽", href: "/foods?category=set", categories: ["set"] },
  { label: "ライス", icon: "🍛", href: "/foods?category=rice", categories: ["rice"] },
];

const homeCategoryLabels = new Set(["すべて", "チュリトス", "ポップコーン", "ドリンク", "ピザ", "バーガー", "スイーツ", "キッズ"]);

const homeAreaChips = [
  { label: "ニンテンドー", icon: "🎮", match: "ニンテンドー" },
  { label: "ミニオン", icon: "🍌", match: "ミニオン" },
  { label: "ハリポタ", icon: "🪄", match: "ハリー" },
  { label: "ジュラシック", icon: "🦖", match: "ジュラシック" },
  { label: "ニューヨーク", icon: "🗽", match: "ニューヨーク" }
];

export function HomeDashboard({ foods, areas = [] }: HomeDashboardProps) {
  const completableFoods = foods.filter(isCompletableFood);
  const foodIds = completableFoods.map((food) => food.id);
  const archiveFoodIds = foods.map((food) => food.id);
  const homeRails = buildHomeRails(foods);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#fffaf5_0%,#f7fbff_48%,#ffffff_100%)] pb-32 text-ink">
      <div className="mx-auto flex w-full min-w-0 max-w-[1040px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <header className="min-w-0 overflow-hidden rounded-2xl border border-white/80 bg-white/88 px-3 py-2.5 shadow-[0_10px_28px_rgba(31,41,55,0.06)] backdrop-blur-xl">
          <HomeHeaderStats foodIds={foodIds} total={completableFoods.length} archiveFoodIds={archiveFoodIds} archiveTotal={foods.length} />
        </header>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-ink">今日何食べる？</h1>
              <p className="mt-1 text-xs font-bold text-ink/45">写真と価格でさっと選べます</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link href="/want" className="rounded-full bg-amber-100 px-4 py-3 text-xs font-black text-amber-800 shadow-sm active:scale-95">
                🏁 次回食べたい
              </Link>
              <Link href="/request" className="rounded-full bg-park px-5 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,128,96,0.24)] active:scale-95">
                情報提供
              </Link>
            </div>
          </div>

          <QuickFilterRail />
          <AreaShortcutRail areas={areas} foods={foods} />
          <FoodRail title="終了間近TOP5" foods={homeRails.endingSoonFoods} reasonMode="remaining" />
          <FoodRail title="限定フード" foods={homeRails.limitedFoods} strategy="limited" showRank />
          <FoodRail title="コスパ最強" foods={homeRails.valueFoods} strategy="value" showRank />
          <FoodRail title="SNSで人気" foods={homeRails.socialFoods} strategy="social" showRank />
          <FoodRail title="初めてならこれ" foods={homeRails.firstVisitFoods} strategy="first-visit" showRank />
          <FoodRail title="新着追加" foods={homeRails.newFoods} />
          <ExploreAllCard total={foods.length} />
        </section>
      </div>
    </main>
  );
}

function buildHomeRails(foods: FoodWithRelations[]) {
  const exposedIds = new Set<string>();
  const endingSoonFoods = takeUniqueFoods(
    [...foods]
      .filter((food) => isEndingSoon(food, 30))
      .sort((a, b) => remainingSortValue(a) - remainingSortValue(b) || a.name.localeCompare(b.name, "ja")),
    exposedIds,
    5
  );
  const limitedFoods = takeUniqueFoods(rankFoodsByStrategy(foods, "limited", [], 14, exposedIds), exposedIds, 5);
  const valueFoods = takeUniqueFoods(rankFoodsByStrategy(foods, "value", [], 14, exposedIds), exposedIds, 5);
  const socialFoods = takeUniqueFoods(rankFoodsByStrategy(foods, "social", [], 14, exposedIds), exposedIds, 5);
  const firstVisitFoods = takeUniqueFoods(rankFoodsByStrategy(foods, "first-visit", [], 14, exposedIds), exposedIds, 5);
  const newFoods = takeUniqueFoods(
    [...foods].sort((a, b) => (b.lastCheckedAt || "").localeCompare(a.lastCheckedAt || "")),
    exposedIds,
    5
  );
  return { endingSoonFoods, limitedFoods, valueFoods, socialFoods, firstVisitFoods, newFoods };
}

function takeUniqueFoods(candidates: FoodWithRelations[], exposedIds: Set<string>, limit: number) {
  const selected: FoodWithRelations[] = [];
  for (const food of candidates) {
    if (exposedIds.has(food.id)) continue;
    selected.push(food);
    exposedIds.add(food.id);
    if (selected.length >= limit) break;
  }
  return selected;
}

function hasPrice(food: FoodWithRelations) {
  return Boolean(food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price);
}

function remainingSortValue(food: FoodWithRelations) {
  return getRemainingDays(food) ?? Number.MAX_SAFE_INTEGER;
}

function QuickFilterRail() {
  const chips = categoryChips.filter((chip) => homeCategoryLabels.has(chip.label));
  return (
    <section className="space-y-2" aria-label="人気ジャンル">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-slate-500">ジャンルで先に決める</p>
        <Link href="/foods" className="text-[11px] font-black text-park">詳細フィルタへ</Link>
      </div>
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white px-2.5 text-[11px] font-black text-ink shadow-sm active:scale-[0.98]"
            >
              <span aria-hidden>{chip.icon}</span>
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AreaShortcutRail({ areas, foods }: { areas: Area[]; foods: FoodWithRelations[] }) {
  const chips = homeAreaChips.map((chip) => {
    const area = areas.find((candidate) => candidate.name.includes(chip.match));
    const count = foods.filter((food) => {
      if (area && food.areaId === area.id) return true;
      return food.area?.name.includes(chip.match) || food.locations?.some((location) => location.areaName.includes(chip.match));
    }).length;
    return {
      ...chip,
      href: area ? `/areas/${area.id}` : "/areas",
      count
    };
  });

  return (
    <section className="space-y-2" aria-label="エリアから選ぶ">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-slate-500">エリアから選ぶ</p>
        <Link href="/areas" className="text-[11px] font-black text-park">全エリアへ</Link>
      </div>
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/80 bg-white px-3 text-[11px] font-black text-ink shadow-sm active:scale-[0.98]"
            >
              <span aria-hidden>{chip.icon}</span>
              <span>{chip.label}</span>
              <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] text-park">{chip.count}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExploreAllCard({ total }: { total: number }) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#f0fff8_52%,#eef7ff_100%)] p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-ink">全商品は「探す」で見る</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">写真中心の一覧で{total}種類から選べます。</p>
        </div>
        <Link href="/foods" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white shadow-sm active:scale-[0.98]">
          探す
        </Link>
      </div>
    </section>
  );
}

function FoodRail({
  title,
  foods,
  showRank = false,
  strategy,
  reasonMode
}: {
  title: string;
  foods: FoodWithRelations[];
  showRank?: boolean;
  strategy?: FoodStrategy;
  reasonMode?: "remaining";
}) {
  if (foods.length === 0) return null;
  const caption = reasonMode === "remaining" ? "販売終了日が近い順" : strategy ? strategyCaption(strategy) : title === "新着追加" ? "最近追加された候補から選ぶ" : null;
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-ink">{title}</h2>
          {caption ? <p className="mt-0.5 truncate text-[11px] font-bold text-slate-500">{caption}</p> : null}
        </div>
        <Link href="/foods" className="text-xs font-black text-park">もっと見る</Link>
      </div>
      <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-3">
          {foods.map((food, index) => (
            <MiniFoodCard
              key={`${title}-${food.id}`}
              food={food}
              rank={showRank ? index + 1 : undefined}
              reason={reasonMode === "remaining" ? remainingReason(food) : strategy ? thumbnailReason(valueReason(food, strategy)) : undefined}
              strategy={strategy}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function strategyCaption(strategy: FoodStrategy) {
  const captions: Record<FoodStrategy, string> = {
    "first-visit": "代表性と買いやすさで選ぶ",
    expert: "味と満足度で選ぶ",
    limited: "限定性と希少性で選ぶ",
    value: "価格と満足度のバランスで選ぶ",
    social: "写真映えと記念感で選ぶ",
    rising: "最近追加と限定感で選ぶ",
    rainy: "店内で選びやすい商品",
    family: "子ども連れでも選びやすい商品",
    solo: "一人でも買いやすい商品"
  };
  return captions[strategy];
}

function MiniFoodCard({
  food,
  rank,
  reason,
  strategy
}: {
  food: FoodWithRelations;
  rank?: number;
  reason?: string;
  strategy?: FoodStrategy;
}) {
  const highlights = strategy ? strategyStarHighlights(food, strategy) : [];
  return (
    <article className="w-[156px] shrink-0 overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <Link href={`/foods/${food.id}`} className="block">
        <div className="relative h-[106px] overflow-hidden bg-slate-100">
          <FoodImage food={food} className="h-full w-full" />
          {rank && rank <= 3 ? <span className="absolute left-2 top-2 rounded-full bg-white/95 px-3 py-1 text-sm font-black text-ink shadow-[0_8px_20px_rgba(15,23,42,0.16)]">{rankLabel(rank)}</span> : null}
          {food.isLimited ? <span className="absolute right-2 top-2 rounded-full bg-berry px-2 py-0.5 text-[10px] font-black text-white">限定</span> : null}
          {food.status === "ended" ? <span className="absolute left-2 top-2 rounded-full bg-slate-800/88 px-2 py-0.5 text-[10px] font-black text-white">販売終了</span> : null}
          {reason ? <span className="absolute left-2 bottom-2 rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-black text-park shadow-sm">{reason}</span> : null}
        </div>
        <div className="space-y-1 p-2.5">
          <p className="line-clamp-2 h-10 text-xs font-black leading-5 text-ink [overflow-wrap:anywhere]">{food.name}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-black text-park">{homePriceText(food)}</p>
            <p className="shrink-0 rounded-full bg-mint/65 px-2 py-0.5 text-[10px] font-black text-park">{food.isLimited ? "限定" : "候補"}</p>
          </div>
          <p className="truncate text-[10px] font-bold text-slate-600">{food.area.name}</p>
          {highlights.length > 0 ? (
            <div className="space-y-0.5 pt-1">
              {highlights.map((item) => (
                <p key={item.label} className="flex items-center justify-between gap-2 text-[10px] font-black text-slate-500">
                  <span>{item.label}</span>
                  <span className="tracking-[0.08em] text-amber-400">{starText(item.value)}</span>
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

function starText(value: number) {
  return "★".repeat(value) + "☆".repeat(Math.max(0, 5 - value));
}

function thumbnailReason(reason?: string) {
  if (!reason) return undefined;
  if (/価格|確認/.test(reason)) return "コスパ";
  return reason;
}

function remainingReason(food: FoodWithRelations) {
  const days = getRemainingDays(food);
  if (typeof days !== "number") return "終了日確認済";
  if (days <= 14) return `残り${days}日`;
  return "終了間近";
}

function homePriceText(food: FoodWithRelations) {
  return hasPrice(food) ? formatFoodPrice(food) : "¥ --";
}

function heroPriceLine(food: FoodWithRelations) {
  const price = homePriceText(food);
  return price === "¥ --" ? food.area.name : `${price} / ${food.area.name}`;
}

function rankLabel(rank: number) {
  if (rank === 1) return "1位";
  if (rank === 2) return "2位";
  if (rank === 3) return "3位";
  return "";
}
