"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const IOS_TEST_BANNER_AD_ID = "ca-app-pub-3940256099942544/2934735716";

type CapacitorBridge = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
};

type WindowWithCapacitor = Window & {
  Capacitor?: CapacitorBridge;
};

function getCapacitorBridge(): CapacitorBridge | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (window as WindowWithCapacitor).Capacitor;
}

function isNativeCapacitorApp(): boolean {
  const capacitor = getCapacitorBridge();

  if (!capacitor) {
    return false;
  }

  if (capacitor.isNativePlatform?.()) {
    return true;
  }

  const platform = capacitor.getPlatform?.();
  return platform === "ios" || platform === "android";
}

function isAdminPath(pathname: string | null): boolean {
  return pathname === "/admin" || Boolean(pathname?.startsWith("/admin/"));
}

function describeError(error: unknown): { name?: string; message?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { message: String(error) };
}

export function MobileAdMobBanner() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function syncBanner() {
      if (!isNativeCapacitorApp()) {
        return;
      }

      const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");

      if (cancelled) {
        return;
      }

      if (isAdminPath(pathname)) {
        await AdMob.hideBanner().catch(() => undefined);
        await AdMob.removeBanner().catch(() => undefined);
        return;
      }

      try {
        await AdMob.initialize({
          initializeForTesting: true
        });

        if (cancelled) {
          return;
        }

        await AdMob.showBanner({
          adId: IOS_TEST_BANNER_AD_ID,
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: true,
          npa: true
        });
      } catch (error) {
        console.error("AdMob test banner failed", {
          placement: "ios-bottom-banner",
          ...describeError(error)
        });
      }
    }

    void syncBanner();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (!isNativeCapacitorApp()) {
        return;
      }

      void import("@capacitor-community/admob")
        .then(({ AdMob }) => AdMob.removeBanner())
        .catch(() => undefined);
    };
  }, []);

  return null;
}
