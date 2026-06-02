"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { captureAnalyticsEvent } from "@/lib/observability";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    void captureAnalyticsEvent("page_view", {
      path: pathname,
      search: window.location.search,
      title: document.title
    });
  }, [pathname]);

  return null;
}
