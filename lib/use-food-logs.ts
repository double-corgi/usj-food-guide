"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readLocalFoodLogs, writeLocalFoodLogs } from "@/lib/local-user-data";
import { syncWidgetFromLogs } from "@/lib/ios/widget-sync";
import type { UserFoodLog } from "@/types/domain";

export type FoodLogSyncStatus = "local" | "error";

export function useFoodLogs() {
  const [logs, setLogs] = useState<UserFoodLog[]>([]);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<FoodLogSyncStatus>("local");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLogs(readLocalFoodLogs());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const persistLogs = useCallback((nextLogs: UserFoodLog[]) => {
    try {
      writeLocalFoodLogs(nextLogs);
      setLogs(nextLogs);
      setLastSavedAt(new Date().toISOString());
      syncWidgetFromLogs(nextLogs);
      setSyncStatus("local");
      setError(null);
    } catch (storageError) {
      setSyncStatus("error");
      setError(storageError instanceof Error ? storageError.message : "端末内保存に失敗しました。");
    }
  }, []);

  const actions = useMemo(
    () => ({
      reload() {
        setLogs(readLocalFoodLogs());
        setLastSavedAt(new Date().toISOString());
        setSyncStatus("local");
        setError(null);
      },
      toggleEaten(foodId: string, spentAmount?: number) {
        const exists = logs.some((log) => log.foodId === foodId && log.status === "eaten");
        if (exists) {
          persistLogs(logs.filter((log) => !(log.foodId === foodId && log.status === "eaten")));
          return;
        }
        persistLogs([
          ...logs,
          {
            foodId,
            status: "eaten" as const,
            eatenAt: new Date().toISOString(),
            eatenCount: 1,
            spentAmount,
            updatedAt: new Date().toISOString()
          }
        ]);
      },
      updateEatenDetails(foodId: string, details: Pick<UserFoodLog, "rating" | "memo" | "eatenAt" | "spentAmount" | "userPhotoUrl" | "repeatWant" | "recommended" | "sharedAt" | "photoIds" | "shopId">) {
        const previous = logs.find((log) => log.foodId === foodId && log.status === "eaten");
        const nextLog: UserFoodLog = {
          foodId,
          status: "eaten",
          eatenAt: details.eatenAt || previous?.eatenAt || new Date().toISOString(),
          eatenCount: previous?.eatenCount ?? 1,
          spentAmount: details.spentAmount ?? previous?.spentAmount,
          rating: details.rating,
          memo: details.memo,
          userPhotoUrl: details.userPhotoUrl,
          repeatWant: details.repeatWant,
          recommended: details.recommended,
          sharedAt: details.sharedAt,
          photoIds: details.photoIds,
          shopId: details.shopId,
          updatedAt: new Date().toISOString()
        };
        persistLogs([...logs.filter((item) => !(item.foodId === foodId && item.status === "eaten")), nextLog]);
      },
      removeEaten(foodId: string) {
        persistLogs(logs.filter((log) => !(log.foodId === foodId && log.status === "eaten")));
      },
      recordAnotherBite(foodId: string, spentAmount?: number) {
        const previous = logs.find((log) => log.foodId === foodId && log.status === "eaten");
        const nextLog: UserFoodLog = {
          ...previous,
          foodId,
          status: "eaten",
          eatenAt: new Date().toISOString(),
          eatenCount: (previous?.eatenCount ?? (previous ? 1 : 0)) + 1,
          spentAmount: spentAmount ?? previous?.spentAmount,
          photoIds: previous?.photoIds,
          shopId: previous?.shopId,
          updatedAt: new Date().toISOString()
        };
        persistLogs([...logs.filter((log) => !(log.foodId === foodId && log.status === "eaten")), nextLog]);
      }
    }),
    [logs, persistLogs]
  );

  return {
    logs,
    ready,
    isAuthenticated: true,
    syncStatus,
    lastSyncedAt: lastSavedAt,
    migrationStatus: "none" as const,
    error,
    ...actions
  };
}
