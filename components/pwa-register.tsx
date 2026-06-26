"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (!shouldEnablePwa()) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch(() => undefined);
      if ("caches" in window) {
        void window.caches.keys().then((keys) => Promise.all(keys.map((key) => window.caches.delete(key)))).catch(() => undefined);
      }
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!shouldEnablePwa()) return;
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!shouldEnablePwa()) return;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const dismissed = window.localStorage.getItem("uniba-pwa-ios-hint-dismissed") === "1";
    const timeoutId = window.setTimeout(() => setShowIosHint(isIos && !isStandalone && !dismissed), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!installPrompt && !showIosHint) return null;

  if (showIosHint && !installPrompt) {
    return (
      <div className="fixed right-4 top-20 z-40 max-w-[18rem] rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur md:bottom-6 md:top-auto md:max-w-sm">
        <button
          type="button"
          aria-label="閉じる"
          onClick={() => {
            window.localStorage.setItem("uniba-pwa-ios-hint-dismissed", "1");
            setShowIosHint(false);
          }}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500"
        >
          <X size={15} aria-hidden />
        </button>
        <p className="pr-8 text-xs font-black text-ink">ホーム画面に追加</p>
        <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500">Safariの共有から追加できます。</p>
      </div>
    );
  }

  const prompt = installPrompt;
  if (!prompt) return null;

  return (
    <button
      type="button"
      aria-label="ホーム画面に追加"
      onClick={() => {
        void prompt.prompt();
        setInstallPrompt(null);
      }}
      className="fixed right-3 top-[4.6rem] z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white shadow-[0_12px_32px_rgba(15,23,42,0.22)] md:bottom-6 md:top-auto md:w-auto md:gap-2 md:px-4 md:text-sm md:font-black"
    >
      <Download size={18} aria-hidden />
      <span className="hidden md:inline">ホーム画面に追加</span>
    </button>
  );
}

function shouldEnablePwa() {
  if (isCapacitorWebView()) return false;
  if (process.env.NODE_ENV !== "production") return false;
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return false;
  if (hostname.endsWith(".trycloudflare.com")) return false;
  return true;
}

function isCapacitorWebView() {
  const maybeWindow = window as Window & {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  };
  if (maybeWindow.Capacitor?.isNativePlatform?.()) return true;
  const platform = maybeWindow.Capacitor?.getPlatform?.();
  return platform === "ios" || platform === "android";
}
