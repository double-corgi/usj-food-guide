"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { UserFoodLog } from "@/types/domain";

const storageKey = "uniba-food-logs-v1";

function readLogs(): UserFoodLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    return JSON.parse(raw) as UserFoodLog[];
  } catch {
    return [];
  }
}

export function useFoodLogs() {
  const supabase = createBrowserSupabaseClient();
  const [logs, setLogs] = useState<UserFoodLog[]>([]);
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!supabase) {
      const localId = window.setTimeout(() => {
        if (cancelled) return;
        setLogs(readLogs());
        setReady(true);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(localId);
      };
    }

    const fallbackId = window.setTimeout(() => {
      if (!cancelled) {
        setReady(true);
      }
    }, 2500);

    supabase.auth.getUser()
      .then(async ({ data }) => {
        if (cancelled) return;
        const user = data.user;
        setIsAuthenticated(Boolean(user));
        if (!user) {
          setLogs(readLogs());
          setReady(true);
          return;
        }
        const { data: rows, error: fetchError } = await supabase.from("user_food_logs").select("*").eq("user_id", user.id);
        if (cancelled) return;
        if (fetchError) {
          setError(fetchError.message);
          setLogs(readLogs());
        } else {
          setLogs(
            (rows ?? []).map((row) => ({
              foodId: row.food_id,
              status: row.status,
              rating: row.rating ?? undefined,
              memo: row.memo ?? undefined,
              eatenAt: row.eaten_at ?? undefined,
              eatenCount: 1,
              userPhotoUrl: row.user_photo_url ?? undefined,
              repeatWant: row.repeat_want ?? undefined,
              recommended: row.recommended ?? undefined,
              sharedAt: row.shared_at ?? undefined
            }))
          );
        }
        setReady(true);
      })
      .catch((fetchError: Error) => {
        if (cancelled) return;
        setError(fetchError.message);
        setLogs(readLogs());
        setReady(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackId);
    };
  }, [supabase]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(logs));
      } catch {
        // localStorage may be unavailable in private contexts.
      }
    }
  }, [isAuthenticated, logs, ready]);

  const persistLog = useCallback(async (log: UserFoodLog, remove = false) => {
    if (!supabase || !isAuthenticated) return;
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    const result = remove
      ? await supabase.from("user_food_logs").delete().eq("user_id", user.id).eq("food_id", log.foodId).eq("status", log.status)
      : await supabase.from("user_food_logs").upsert(
          {
            user_id: user.id,
            food_id: log.foodId,
            status: log.status,
            rating: log.rating ?? null,
            memo: log.memo ?? null,
            eaten_at: log.eatenAt ?? null,
            user_photo_url: log.userPhotoUrl ?? null,
            repeat_want: log.repeatWant ?? null,
            recommended: log.recommended ?? null,
            shared_at: log.sharedAt ?? null
          },
          { onConflict: "user_id,food_id,status" }
        );
    if (result.error) setError(result.error.message);
  }, [isAuthenticated, supabase]);

  const actions = useMemo(
    () => ({
      toggleWant(foodId: string) {
        let removed = false;
        const wantsToRemove: string[] = [];
        setLogs((current) => {
          const exists = current.some((log) => log.foodId === foodId && log.status === "want");
          if (exists) {
            removed = true;
            return current.filter((log) => !(log.foodId === foodId && log.status === "want"));
          }
          const currentWants = current.filter((log) => log.status === "want");
          wantsToRemove.push(...currentWants.map((log) => log.foodId));
          return [...current.filter((log) => log.status !== "want"), { foodId, status: "want" as const }];
        });
        for (const oldFoodId of wantsToRemove) {
          void persistLog({ foodId: oldFoodId, status: "want" }, true);
        }
        void persistLog({ foodId, status: "want" }, removed);
      },
      toggleEaten(foodId: string) {
        let removed = false;
        const eatenAt = new Date().toISOString().slice(0, 10);
        setLogs((current) => {
          const exists = current.some((log) => log.foodId === foodId && log.status === "eaten");
          if (exists) {
            removed = true;
            return current.filter((log) => !(log.foodId === foodId && log.status === "eaten"));
          }
          return [
            ...current.filter((log) => !(log.foodId === foodId && log.status === "want")),
            { foodId, status: "eaten" as const, eatenAt, eatenCount: 1 }
          ];
        });
        void persistLog({ foodId, status: "eaten", eatenAt, eatenCount: 1 }, removed);
        if (!removed) void persistLog({ foodId, status: "want" }, true);
      },
      updateEatenDetails(foodId: string, details: Pick<UserFoodLog, "rating" | "memo" | "eatenAt" | "userPhotoUrl" | "repeatWant" | "recommended" | "sharedAt">) {
        const previous = logs.find((log) => log.foodId === foodId && log.status === "eaten");
        const log = {
          foodId,
          status: "eaten" as const,
          eatenAt: details.eatenAt || new Date().toISOString().slice(0, 10),
          eatenCount: previous?.eatenCount ?? 1,
          rating: details.rating,
          memo: details.memo,
          userPhotoUrl: details.userPhotoUrl,
          repeatWant: details.repeatWant,
          recommended: details.recommended,
          sharedAt: details.sharedAt
        };
        setLogs((current) => {
          const without = current.filter((log) => !(log.foodId === foodId && log.status === "eaten"));
          return [...without, log];
        });
        void persistLog(log);
      },
      recordAnotherBite(foodId: string) {
        const eatenAt = new Date().toISOString().slice(0, 10);
        let nextLog: UserFoodLog = { foodId, status: "eaten", eatenAt, eatenCount: 1 };
        setLogs((current) => {
          const previous = current.find((log) => log.foodId === foodId && log.status === "eaten");
          nextLog = {
            ...previous,
            foodId,
            status: "eaten",
            eatenAt,
            eatenCount: (previous?.eatenCount ?? (previous ? 1 : 0)) + 1
          };
          return [...current.filter((log) => !(log.foodId === foodId && log.status === "eaten") && !(log.foodId === foodId && log.status === "want")), nextLog];
        });
        void persistLog(nextLog);
      }
    }),
    [logs, persistLog]
  );

  return { logs, ready, isAuthenticated, error, ...actions };
}
