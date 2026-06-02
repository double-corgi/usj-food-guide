"use client";

import { useEffect } from "react";
import { captureAppError } from "@/lib/observability";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureAppError(error, {
      boundary: "app-error",
      digest: error.digest ?? null,
      route: window.location.pathname
    });
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl rounded-[1.6rem] border border-rose-100 bg-white p-6 text-center shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">Error</p>
      <h1 className="mt-2 text-2xl font-black text-ink">画面の読み込みに失敗しました</h1>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
        一時的な不具合の可能性があります。もう一度読み込み直してください。
      </p>
      <button type="button" onClick={reset} className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-ink px-6 text-sm font-black text-white">
        再読み込み
      </button>
    </section>
  );
}
