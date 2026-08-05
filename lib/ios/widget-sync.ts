"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";
import type { UserFoodLog } from "@/types/domain";

type WidgetSyncPlugin = {
  update(options: { eatenCount: number; progressRate: number; recentFoodName?: string; updatedAt?: string }): Promise<void>;
};

const WidgetSync = registerPlugin<WidgetSyncPlugin>("WidgetSync");
const DEFAULT_TOTAL_FOODS = 181;
const recentFoodNameKey = "unicolle-widget-recent-food-name";

function canUseNativeWidgetSync() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export function rememberWidgetRecentFoodName(foodName?: string | null) {
  if (typeof window === "undefined" || !foodName) return;
  try {
    window.localStorage.setItem(recentFoodNameKey, foodName);
  } catch {
    // Widget freshness must never block local food log writes.
  }
}

export function syncWidgetFromLogs(logs: UserFoodLog[], totalFoods = DEFAULT_TOTAL_FOODS) {
  const eatenLogs = logs.filter((log) => log.status === "eaten");
  const eatenCount = eatenLogs.length;
  const progressRate = totalFoods > 0 ? Math.min(100, Math.round((eatenCount / totalFoods) * 100)) : 0;
  let recentFoodName: string | undefined;
  try {
    recentFoodName = window.localStorage.getItem(recentFoodNameKey) || undefined;
  } catch {
    recentFoodName = undefined;
  }
  void syncWidgetSummary({ eatenCount, progressRate, recentFoodName });
}

export async function syncWidgetSummary(options: { eatenCount: number; progressRate: number; recentFoodName?: string | null }) {
  if (!canUseNativeWidgetSync()) return;
  try {
    await WidgetSync.update({
      eatenCount: Math.max(0, Math.floor(options.eatenCount || 0)),
      progressRate: Math.max(0, Math.min(100, Math.floor(options.progressRate || 0))),
      recentFoodName: options.recentFoodName || undefined,
      updatedAt: new Date().toISOString()
    });
  } catch {
    // Widget sync is best-effort and should not change the app UI or record result.
  }
}
