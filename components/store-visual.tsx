"use client";

import { Coffee, IceCreamBowl, Popcorn, ShoppingCart, Store, Utensils } from "lucide-react";
import type { StoreWithFoods } from "@/lib/store-utils";

export function StoreVisual({
  store,
  className,
  iconSize = 26,
  eager = false
}: {
  store: Pick<StoreWithFoods, "name" | "areaName" | "kindLabel" | "imageUrl" | "imageAlt" | "imageKind" | "visualTone" | "visualIcon" | "visualPosition">;
  className?: string;
  iconSize?: number;
  eager?: boolean;
}) {
  if (store.imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className ?? ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.imageUrl}
          alt={store.imageAlt}
          loading={eager ? "eager" : "lazy"}
          className="h-full w-full object-cover"
          style={{ objectPosition: store.visualPosition }}
        />
        <div className={`absolute inset-0 ${areaOverlayMap[store.visualTone]}`} aria-hidden />
        <div className={`absolute inset-y-0 left-0 w-1 ${areaLineMap[store.visualTone]}`} aria-hidden />
      </div>
    );
  }

  const Icon = iconMap[store.visualIcon];
  const tone = toneMap[store.visualTone];

  return (
    <div
      className={`relative grid place-items-center border ${tone.wrapper} ${className ?? ""}`}
      aria-label={`${store.name}の店舗画像`}
      role="img"
    >
      <div className={`absolute inset-0 ${tone.pattern}`} aria-hidden />
      <div className={`relative grid h-12 w-12 place-items-center rounded-full ${tone.iconBg} ${tone.iconText} shadow-sm`}>
        <Icon size={iconSize} aria-hidden />
      </div>
    </div>
  );
}

const iconMap = {
  restaurant: Utensils,
  cart: ShoppingCart,
  cafe: Coffee,
  popcorn: Popcorn,
  snack: IceCreamBowl,
  store: Store
} satisfies Record<StoreWithFoods["visualIcon"], typeof Store>;

const toneMap = {
  green: {
    wrapper: "border-park/15 bg-mint",
    pattern: "bg-[radial-gradient(circle_at_22%_18%,rgba(0,87,184,0.15),transparent_36%),linear-gradient(135deg,#ffffff,#e8f2ff)]",
    iconBg: "bg-white/82",
    iconText: "text-park"
  },
  blue: {
    wrapper: "border-park/15 bg-mint",
    pattern: "bg-[radial-gradient(circle_at_22%_18%,rgba(0,87,184,0.14),transparent_36%),linear-gradient(135deg,#ffffff,#e8f2ff)]",
    iconBg: "bg-white/82",
    iconText: "text-park"
  },
  gold: {
    wrapper: "border-sun/35 bg-sun/15",
    pattern: "bg-[radial-gradient(circle_at_22%_18%,rgba(253,187,48,0.25),transparent_36%),linear-gradient(135deg,#ffffff,#fff2c8)]",
    iconBg: "bg-white/82",
    iconText: "text-ink"
  },
  cyan: {
    wrapper: "border-park/15 bg-mint",
    pattern: "bg-[radial-gradient(circle_at_22%_18%,rgba(0,87,184,0.12),transparent_36%),linear-gradient(135deg,#ffffff,#edf6ff)]",
    iconBg: "bg-white/82",
    iconText: "text-park"
  },
  navy: {
    wrapper: "border-slate-200 bg-slate-100",
    pattern: "bg-[radial-gradient(circle_at_22%_18%,rgba(15,23,42,0.16),transparent_36%),linear-gradient(135deg,#f8fafc,#e2e8f0)]",
    iconBg: "bg-white/82",
    iconText: "text-slate-700"
  },
  slate: {
    wrapper: "border-slate-200 bg-slate-50",
    pattern: "bg-[radial-gradient(circle_at_22%_18%,rgba(100,116,139,0.14),transparent_36%),linear-gradient(135deg,#ffffff,#f1f5f9)]",
    iconBg: "bg-white/82",
    iconText: "text-slate-600"
  }
} satisfies Record<StoreWithFoods["visualTone"], { wrapper: string; pattern: string; iconBg: string; iconText: string }>;

const areaOverlayMap = {
  green: "bg-gradient-to-br from-ink/14 via-transparent to-park/18",
  blue: "bg-gradient-to-br from-ink/14 via-transparent to-park/20",
  gold: "bg-gradient-to-br from-ink/12 via-transparent to-sun/24",
  cyan: "bg-gradient-to-br from-ink/12 via-transparent to-park/16",
  navy: "bg-gradient-to-br from-slate-950/18 via-transparent to-slate-700/22",
  slate: "bg-gradient-to-br from-slate-950/10 via-transparent to-slate-400/16"
} satisfies Record<StoreWithFoods["visualTone"], string>;

const areaLineMap = {
  green: "bg-park/70",
  blue: "bg-park/70",
  gold: "bg-sun/90",
  cyan: "bg-park/55",
  navy: "bg-ink/75",
  slate: "bg-slate-400/70"
} satisfies Record<StoreWithFoods["visualTone"], string>;
