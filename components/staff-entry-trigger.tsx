"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation";

export function StaffEntryTrigger({ children }: { children: ReactNode }) {
  const router = useRouter();
  const countRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTap() {
    countRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      countRef.current = 0;
    }, 2200);
    if (countRef.current >= 7) {
      countRef.current = 0;
      router.push("/staff");
    }
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label="このアプリについて"
      className="block w-full touch-manipulation select-text text-left"
    >
      {children}
    </button>
  );
}
