"use client";

import { useEffect, useState } from "react";

type CapacitorBridge = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
};

type WindowWithCapacitor = Window & {
  Capacitor?: CapacitorBridge;
};

type Availability = "checking" | "available" | "unavailable";

function isNativeIosApp() {
  if (typeof window === "undefined") {
    return false;
  }

  const capacitor = (window as WindowWithCapacitor).Capacitor;

  if (!capacitor) {
    return false;
  }

  const platform = capacitor.getPlatform?.();
  return platform === "ios" && capacitor.isNativePlatform?.() === true;
}

function describeError(error: unknown): { name?: string; message?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { message: String(error) };
}

export function AdMobPrivacyOptionsButton() {
  const [availability, setAvailability] = useState<Availability>("checking");
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAvailability() {
      if (!isNativeIosApp()) {
        setAvailability("unavailable");
        return;
      }

      try {
        const { AdMob } = await import("@capacitor-community/admob");
        const consentInfo = await AdMob.requestConsentInfo({
          tagForUnderAgeOfConsent: false
        });

        if (cancelled) {
          return;
        }

        setAvailability(consentInfo.privacyOptionsRequirementStatus === "REQUIRED" ? "available" : "unavailable");
      } catch (error) {
        if (!cancelled) {
          setAvailability("unavailable");
          console.error("AdMob privacy options availability check failed", describeError(error));
        }
      }
    }

    void checkAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  if (availability !== "available") {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
      <h2 className="text-lg font-black text-ink">広告のプライバシー設定</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
        お住まいの地域や同意状態により、Google AdMobの広告プライバシー設定を確認・変更できます。
      </p>
      <button
        type="button"
        disabled={isOpening}
        onClick={async () => {
          setIsOpening(true);
          try {
            const { AdMob } = await import("@capacitor-community/admob");
            await AdMob.showPrivacyOptionsForm();
          } catch (error) {
            console.error("AdMob privacy options form failed", describeError(error));
          } finally {
            setIsOpening(false);
          }
        }}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-5 text-sm font-black text-white transition hover:bg-park disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isOpening ? "開いています..." : "広告のプライバシー設定を開く"}
      </button>
    </div>
  );
}
