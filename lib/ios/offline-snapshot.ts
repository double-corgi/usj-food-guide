import { isNativeIosApp } from "@/lib/ios/native";
import type { Area, FoodCollection, FoodWithRelations } from "@/types/domain";

export type IosOfflineSnapshot = {
  savedAt: string;
  foods: FoodWithRelations[];
  areas: Area[];
  collections: FoodCollection[];
};

const SNAPSHOT_KEY = "unicolle-ios-offline-snapshot-v1";

export async function saveOfflineSnapshot(snapshot: Omit<IosOfflineSnapshot, "savedAt">) {
  const value = JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() });
  if (isNativeIosApp()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: SNAPSHOT_KEY, value });
    return;
  }
  if (typeof window !== "undefined") window.localStorage.setItem(SNAPSHOT_KEY, value);
}

export async function readOfflineSnapshot(): Promise<IosOfflineSnapshot | null> {
  try {
    let value: string | null = null;
    if (isNativeIosApp()) {
      const { Preferences } = await import("@capacitor/preferences");
      value = (await Preferences.get({ key: SNAPSHOT_KEY })).value;
    } else if (typeof window !== "undefined") {
      value = window.localStorage.getItem(SNAPSHOT_KEY);
    }
    if (!value) return null;
    const parsed = JSON.parse(value) as IosOfflineSnapshot;
    if (!Array.isArray(parsed.foods) || !Array.isArray(parsed.areas) || !Array.isArray(parsed.collections)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getNetworkOnline(): Promise<boolean> {
  if (isNativeIosApp()) {
    try {
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();
      return status.connected;
    } catch {
      return typeof navigator === "undefined" ? true : navigator.onLine;
    }
  }
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export async function addNetworkListener(callback: (online: boolean) => void): Promise<() => void> {
  if (isNativeIosApp()) {
    try {
      const { Network } = await import("@capacitor/network");
      const handle = await Network.addListener("networkStatusChange", (status) => callback(status.connected));
      return () => { void handle.remove(); };
    } catch {
      // Fall through to browser listeners.
    }
  }
  if (typeof window === "undefined") return () => undefined;
  const online = () => callback(true);
  const offline = () => callback(false);
  window.addEventListener("online", online);
  window.addEventListener("offline", offline);
  return () => {
    window.removeEventListener("online", online);
    window.removeEventListener("offline", offline);
  };
}
