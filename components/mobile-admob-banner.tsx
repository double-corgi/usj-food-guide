"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const IOS_TEST_BANNER_AD_ID = "ca-app-pub-3940256099942544/2934735716";
const ADMOB_BANNER_ATTRIBUTE = "data-mobile-admob-banner";
const IOS_ADMOB_MODE = process.env.NEXT_PUBLIC_IOS_ADMOB_MODE;
const IOS_RELEASE_BANNER_AD_ID = process.env.NEXT_PUBLIC_IOS_ADMOB_BANNER_AD_ID?.trim();
const IOS_ADMOB_CONSENT_DEBUG_GEOGRAPHY = process.env.NEXT_PUBLIC_IOS_ADMOB_CONSENT_DEBUG_GEOGRAPHY
  ?.trim()
  .toLowerCase();
const IOS_ADMOB_CONSENT_TEST_DEVICE_IDS = process.env.NEXT_PUBLIC_IOS_ADMOB_CONSENT_TEST_DEVICE_IDS?.trim();

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

function setAdMobBannerSpacing(isVisible: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  if (isVisible) {
    document.documentElement.setAttribute(ADMOB_BANNER_ATTRIBUTE, "visible");
    return;
  }

  document.documentElement.removeAttribute(ADMOB_BANNER_ATTRIBUTE);
}

function getIosBannerConfig() {
  const useReleaseAd = IOS_ADMOB_MODE === "production" && Boolean(IOS_RELEASE_BANNER_AD_ID);

  return {
    adId: useReleaseAd ? IOS_RELEASE_BANNER_AD_ID! : IOS_TEST_BANNER_AD_ID,
    isTesting: !useReleaseAd
  };
}

type AdMobModule = typeof import("@capacitor-community/admob");

function getDebugGeography(module: AdMobModule) {
  if (IOS_ADMOB_MODE === "production") {
    return undefined;
  }

  switch (IOS_ADMOB_CONSENT_DEBUG_GEOGRAPHY) {
    case "eea":
      return module.AdmobConsentDebugGeography.EEA;
    case "us":
      return module.AdmobConsentDebugGeography.US;
    case "other":
      return module.AdmobConsentDebugGeography.OTHER;
    default:
      return undefined;
  }
}

function getDebugTestDeviceIds() {
  if (IOS_ADMOB_MODE === "production" || !IOS_ADMOB_CONSENT_TEST_DEVICE_IDS) {
    return undefined;
  }

  const ids = IOS_ADMOB_CONSENT_TEST_DEVICE_IDS.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return ids.length > 0 ? ids : undefined;
}

async function requestConsentBeforeAds(module: AdMobModule, isTesting: boolean) {
  const { AdMob } = module;
  const debugGeography = isTesting ? getDebugGeography(module) : undefined;
  const testDeviceIdentifiers = isTesting ? getDebugTestDeviceIds() : undefined;

  let consentInfo = await AdMob.requestConsentInfo({
    ...(debugGeography === undefined ? {} : { debugGeography }),
    ...(testDeviceIdentifiers ? { testDeviceIdentifiers } : {}),
    tagForUnderAgeOfConsent: false
  });

  if (!consentInfo.canRequestAds && consentInfo.isConsentFormAvailable) {
    consentInfo = await AdMob.showConsentForm();
  }

  return consentInfo.canRequestAds;
}

export function MobileAdMobBanner() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function syncBanner() {
      if (!isNativeCapacitorApp()) {
        setAdMobBannerSpacing(false);
        return;
      }

      const admobModule = await import("@capacitor-community/admob");
      const { AdMob, BannerAdPosition, BannerAdSize } = admobModule;

      if (cancelled) {
        return;
      }

      if (isAdminPath(pathname)) {
        setAdMobBannerSpacing(false);
        await AdMob.hideBanner().catch(() => undefined);
        await AdMob.removeBanner().catch(() => undefined);
        return;
      }

      try {
        const bannerConfig = getIosBannerConfig();

        await AdMob.initialize({
          initializeForTesting: bannerConfig.isTesting
        });

        if (cancelled) {
          return;
        }

        const canRequestAds = await requestConsentBeforeAds(admobModule, bannerConfig.isTesting);

        if (cancelled) {
          return;
        }

        if (!canRequestAds) {
          setAdMobBannerSpacing(false);
          await AdMob.hideBanner().catch(() => undefined);
          await AdMob.removeBanner().catch(() => undefined);
          return;
        }

        await AdMob.showBanner({
          adId: bannerConfig.adId,
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
          isTesting: bannerConfig.isTesting,
          npa: true
        });
        setAdMobBannerSpacing(true);
      } catch (error) {
        setAdMobBannerSpacing(false);
        console.error("AdMob banner setup failed", {
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
      setAdMobBannerSpacing(false);

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
