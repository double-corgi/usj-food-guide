"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

function routeForUnicolleURL(value: string) {
  let target = "home";
  try {
    const url = new URL(value);
    target = url.hostname || url.pathname.replace(/^\//, "") || "home";
  } catch {
    target = "home";
  }
  switch (target) {
    case "record":
      return "/foods?record=1";
    case "eaten":
      return "/eaten";
    case "wishlist":
      return "/eaten?tab=want";
    case "home":
    default:
      return "/";
  }
}

export function NativeDeepLinkBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let mounted = true;
    const open = (value: string) => {
      if (!mounted) return;
      router.push(routeForUnicolleURL(value));
    };

    void App.getLaunchUrl().then((result) => {
      if (result?.url) open(result.url);
    });

    const listener = App.addListener("appUrlOpen", (event) => {
      open(event.url);
    });

    return () => {
      mounted = false;
      void listener.then((handle) => handle.remove());
    };
  }, [router]);

  return null;
}
